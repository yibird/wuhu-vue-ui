import { decodeZipHref, resolveZipPath, type ZipReaderLike } from './zip'
import { sanitizeHtml } from './sanitize'
import { attribute, descendants, firstDescendant, parseXml, textOf } from './xml'

export interface EpubChapter {
  /** Resolved ZIP path of the XHTML document. */
  path: string
  /** Original href as found in the OPF. */
  href: string
  title?: string
}

export interface EpubBook {
  title?: string
  author?: string
  chapters: EpubChapter[]
}

export type EpubMediaResolver = (path: string) => Promise<string | null>

interface ManifestItem {
  id: string
  href: string
  path: string
  mediaType: string
  properties: string
}

async function findPackagePath(zip: ZipReaderLike): Promise<string> {
  if (zip.has('META-INF/container.xml')) {
    try {
      const container = parseXml(await zip.text('META-INF/container.xml'))
      const rootfile = firstDescendant(container, 'rootfile')
      const path = rootfile ? attribute(rootfile, 'full-path') : undefined
      if (path && zip.has(path)) return path
    } catch {
      // Fall through to conventional locations.
    }
  }

  for (const candidate of ['OEBPS/content.opf', 'content.opf', 'OPF/content.opf']) {
    if (zip.has(candidate)) return candidate
  }

  throw new Error('The EPUB package document could not be found.')
}

function readManifest(document: Document, packagePath: string): Map<string, ManifestItem> {
  const result = new Map<string, ManifestItem>()
  for (const item of descendants(document, 'item')) {
    const id = attribute(item, 'id')
    const href = attribute(item, 'href')
    if (!id || !href) continue
    const path = resolveZipPath(packagePath, decodeZipHref(href))
    result.set(id, {
      id,
      href,
      path,
      mediaType: attribute(item, 'media-type') ?? '',
      properties: attribute(item, 'properties') ?? '',
    })
  }
  return result
}

async function readNavLabels(
  zip: ZipReaderLike,
  manifest: Map<string, ManifestItem>,
  spineTocId: string | undefined,
): Promise<Map<string, string>> {
  const labels = new Map<string, string>()
  const navItem = Array.from(manifest.values()).find((item) =>
    item.properties.split(/\s+/).includes('nav'),
  )

  if (navItem && zip.has(navItem.path)) {
    try {
      const nav = parseXml(await zip.text(navItem.path))
      const navElements = descendants(nav, 'nav')
      const toc =
        navElements.find((element) => (attribute(element, 'type') ?? '').includes('toc')) ??
        navElements[0]
      if (toc) {
        for (const anchor of descendants(toc, 'a')) {
          const href = attribute(anchor, 'href')
          const label = textOf(anchor).trim()
          if (!href || !label) continue
          const path = resolveZipPath(navItem.path, decodeZipHref(href.split('#')[0] ?? ''))
          labels.set(path.toLowerCase(), label)
        }
      }
    } catch {
      // Ignore a malformed navigation document.
    }
  }

  const ncxItem =
    (spineTocId ? manifest.get(spineTocId) : undefined) ??
    Array.from(manifest.values()).find((item) => item.mediaType === 'application/x-dtbncx+xml')

  if (ncxItem && zip.has(ncxItem.path)) {
    try {
      const ncx = parseXml(await zip.text(ncxItem.path))
      for (const navPoint of descendants(ncx, 'navPoint')) {
        const labelElement = firstDescendant(navPoint, 'text')
        const content = firstDescendant(navPoint, 'content')
        const src = content ? attribute(content, 'src') : undefined
        const label = labelElement?.textContent?.trim()
        if (!src || !label) continue
        const path = resolveZipPath(ncxItem.path, decodeZipHref(src.split('#')[0] ?? ''))
        if (!labels.has(path.toLowerCase())) labels.set(path.toLowerCase(), label)
      }
    } catch {
      // NCX is optional.
    }
  }

  return labels
}

export async function parseEpub(zip: ZipReaderLike): Promise<EpubBook> {
  const packagePath = await findPackagePath(zip)
  const document = parseXml(await zip.text(packagePath))
  const manifest = readManifest(document, packagePath)

  const metadata = firstDescendant(document, 'metadata')
  const title = metadata
    ? firstDescendant(metadata, 'title')?.textContent?.trim() || undefined
    : undefined
  const author = metadata
    ? firstDescendant(metadata, 'creator')?.textContent?.trim() || undefined
    : undefined

  const spine = firstDescendant(document, 'spine')
  const spineTocId = spine ? attribute(spine, 'toc') : undefined
  const labels = await readNavLabels(zip, manifest, spineTocId)

  const chapters: EpubChapter[] = []
  const seen = new Set<string>()

  if (spine) {
    for (const itemref of descendants(spine, 'itemref')) {
      const idref = attribute(itemref, 'idref')
      const item = idref ? manifest.get(idref) : undefined
      if (!item || !zip.has(item.path) || seen.has(item.path)) continue
      if (item.mediaType && !/xhtml|html/i.test(item.mediaType)) continue
      seen.add(item.path)
      chapters.push({
        path: item.path,
        href: item.href,
        title: labels.get(item.path.toLowerCase()),
      })
    }
  }

  if (chapters.length === 0) {
    for (const item of manifest.values()) {
      if (!zip.has(item.path) || seen.has(item.path)) continue
      if (!/xhtml|html/i.test(item.mediaType) && !/\.x?html?$/i.test(item.path)) continue
      seen.add(item.path)
      chapters.push({
        path: item.path,
        href: item.href,
        title: labels.get(item.path.toLowerCase()),
      })
    }
  }

  return { title, author, chapters }
}

function resolveChapterLink(
  chapterPath: string,
  href: string,
  book: EpubBook,
): { page?: number; fragment?: string } {
  const [rawPath, fragment] = href.split('#')
  if (!rawPath) return { fragment }
  const path = resolveZipPath(chapterPath, decodeZipHref(rawPath))
  const page = book.chapters.findIndex(
    (chapter) => chapter.path.toLowerCase() === path.toLowerCase(),
  )
  return { page: page >= 0 ? page + 1 : undefined, fragment }
}

/**
 * Render a single EPUB chapter to sanitized HTML. Images are resolved through
 * `resolveMedia`; the caller owns cleanup of any URLs it creates.
 */
export async function renderEpubChapter(
  zip: ZipReaderLike,
  book: EpubBook,
  index: number,
  resolveMedia: EpubMediaResolver,
): Promise<string> {
  const chapter = book.chapters[index]
  if (!chapter) throw new Error('Chapter not found.')
  if (!zip.has(chapter.path)) throw new Error('Chapter file is missing.')

  const source = await zip.text(chapter.path)
  const document = new DOMParser().parseFromString(source, 'text/html')

  for (const remove of Array.from(
    document.querySelectorAll('script, style, link, meta, base, iframe, object, embed'),
  )) {
    remove.remove()
  }

  for (const image of Array.from(document.querySelectorAll('img'))) {
    const src = image.getAttribute('src')?.trim()
    if (!src) {
      image.remove()
      continue
    }
    if (/^(https?:|data:image\/)/i.test(src)) continue

    const target = resolveZipPath(chapter.path, decodeZipHref(src.split(/[?#]/)[0] ?? ''))
    const alt = image.getAttribute('alt') ?? ''

    try {
      const url = await resolveMedia(target)
      if (url) image.setAttribute('src', url)
      else image.replaceWith(document.createTextNode(alt))
    } catch {
      image.replaceWith(document.createTextNode(alt))
    }
  }

  for (const anchor of Array.from(document.querySelectorAll('a[href]'))) {
    const href = anchor.getAttribute('href')?.trim() ?? ''
    if (!href || href.startsWith('#')) continue
    if (/^(https?:|mailto:|tel:)/i.test(href)) continue

    const resolved = resolveChapterLink(chapter.path, href, book)
    if (resolved.page) {
      anchor.removeAttribute('href')
      anchor.setAttribute('data-epub-page', String(resolved.page))
      if (resolved.fragment) anchor.setAttribute('data-epub-fragment', resolved.fragment)
      anchor.setAttribute('class', 'w-file-viewer__epub-link')
    } else {
      anchor.removeAttribute('href')
    }
  }

  const body = document.body
  if (!body) return ''
  return sanitizeHtml(body.innerHTML, { allowDataImage: true })
}
