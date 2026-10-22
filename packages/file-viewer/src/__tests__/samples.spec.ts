import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'
import { parseDocx } from '../core/docx'
import { parseEpub, renderEpubChapter } from '../core/epub'
import { parsePptx } from '../core/pptx'
import { parseXlsx } from '../core/xlsx'
import { openArchive, ZipArchive } from '../core/zip'

const sample = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(resolve(process.cwd(), 'playground/public/samples', name)))

describe('bundled playground samples', () => {
  it('parses the demo DOCX including its embedded image', async () => {
    const zip = await ZipArchive.open(sample('sample.docx'))
    const pages = await parseDocx(zip, {}, async (path) =>
      zip.has(path) ? `blob:sample/${path}` : null,
    )
    expect(pages.pages).toHaveLength(2)
    expect(pages.pages[0]).toContain('Wuhu File Viewer')
    expect(pages.pages[0]).toContain('Key capabilities')
    expect(pages.pages[0]).toContain('blob:sample/word/media/image1.png')
    expect(pages.pages[0]).toContain('w-file-viewer__docx-table')
    expect(pages.pages[1]).toContain('Page two')
  })

  it('parses the demo XLSX workbook', async () => {
    const zip = await ZipArchive.open(sample('sample.xlsx'))
    const result = await parseXlsx(zip, { locale: 'en-US' })
    expect(result.sheets).toHaveLength(2)
    expect(result.sheets[0]?.name).toBe('Overview')
    expect(result.sheets[0]?.html).toContain('Quarterly revenue')
    expect(result.sheets[0]?.html).toContain('$128,000')
    expect(result.sheets[0]?.html).toContain('21.9%')
    expect(result.sheets[0]?.html).toContain('colspan="5"')
    expect(result.sheets[1]?.html).toContain('Owner')
  })

  it('parses the demo PPTX deck', async () => {
    const zip = await ZipArchive.open(sample('sample.pptx'))
    const result = await parsePptx(zip, {}, async (path) =>
      zip.has(path) ? `blob:sample/${path}` : null,
    )
    expect(result.slides).toHaveLength(2)
    expect(result.slides[0]?.title).toBe('Preview every file')
    expect(result.slides[0]?.html).toContain('blob:sample/ppt/media/image1.png')
    expect(result.slides[1]?.html).toContain('Built for real applications')
    expect(result.slides[1]?.html).toContain('Lazy-loaded renderers')
  })

  it('parses the demo EPUB and renders its first chapter', async () => {
    const zip = await ZipArchive.open(sample('sample.epub'))
    const book = await parseEpub(zip)
    expect(book.title).toBe('Small previews, everywhere')
    expect(book.chapters).toHaveLength(2)
    const html = await renderEpubChapter(zip, book, 0, async () => 'blob:sample/cover')
    expect(html).toContain('A simpler previewer')
    expect(html).toContain('blob:sample/cover')
    expect(html).toContain('data-epub-page="2"')
  })

  it('opens the demo ZIP archive', async () => {
    const archive = await openArchive(sample('sample.zip'), 'sample.zip')
    expect(archive.entries.map((entry) => entry.name)).toContain('src/demo.ts')
    const text = await archive.text('readme.txt')
    expect(text).toContain('Wuhu File Viewer archive demo')
  })

  it('ships a valid PDF header', () => {
    const bytes = sample('sample.pdf')
    const header = new TextDecoder().decode(bytes.subarray(0, 8))
    expect(header).toBe('%PDF-1.4')
  })
})
