import { detectMimeType } from './detect'
import type { ObjectUrlPool } from './format'
import type { ZipArchive } from './zip'

export interface ZipMediaResolver {
  /** Resolves an archive path to a URL, or `null` when it is missing. */
  resolve: (path: string) => Promise<string | null>
  /** Object URLs created by this resolver, in creation order. */
  created: string[]
}

/**
 * Shared media extraction for ZIP-based Office/EPUB documents. Remote URLs
 * pass through unchanged; archive entries are cached and turned into object
 * URLs owned by the supplied pool.
 */
export function createZipMediaResolver(
  zip: ZipArchive,
  urls: ObjectUrlPool,
  isDisposed: () => boolean = () => false,
): ZipMediaResolver {
  const cache = new Map<string, string>()
  const created: string[] = []

  async function resolve(path: string): Promise<string | null> {
    if (/^https?:\/\//i.test(path)) return path

    const cached = cache.get(path)
    if (cached) return cached
    if (!zip.has(path)) return null

    try {
      const mime = detectMimeType(path) ?? 'application/octet-stream'
      const url = urls.create(await zip.blob(path, mime))
      if (isDisposed()) {
        urls.revoke(url)
        return null
      }
      cache.set(path, url)
      created.push(url)
      return url
    } catch {
      return null
    }
  }

  return { resolve, created }
}
