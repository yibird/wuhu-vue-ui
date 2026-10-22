import { describe, expect, it } from 'vite-plus/test'
import {
  detectFileViewerKind,
  detectFormat,
  detectMimeType,
  fileViewerFormatCatalog,
  toFileViewerMeta,
} from '../core/detect'

describe('file detection', () => {
  it('detects office, pdf and media formats', () => {
    expect(detectFileViewerKind('report.pdf')).toBe('pdf')
    expect(detectFileViewerKind('proposal.docx')).toBe('document')
    expect(detectFileViewerKind('notes.rtf')).toBe('document')
    expect(detectFileViewerKind('budget.XLSX')).toBe('spreadsheet')
    expect(detectFileViewerKind('deck.pptx')).toBe('presentation')
    expect(detectFileViewerKind('photo.jpeg')).toBe('image')
    expect(detectFileViewerKind('movie.webm')).toBe('video')
    expect(detectFileViewerKind('voice.mp3')).toBe('audio')
  })

  it('detects text, code and data formats', () => {
    expect(detectFileViewerKind('README.md')).toBe('markdown')
    expect(detectFileViewerKind('component.vue')).toBe('code')
    expect(detectFileViewerKind('data.json')).toBe('json')
    expect(detectFileViewerKind('feed.xml')).toBe('xml')
    expect(detectFileViewerKind('page.html')).toBe('html')
    expect(detectFileViewerKind('table.csv')).toBe('csv')
    expect(detectFileViewerKind('captions.srt')).toBe('subtitle')
    expect(detectFileViewerKind('notes.txt')).toBe('text')
    expect(detectFileViewerKind('book.epub')).toBe('epub')
    expect(detectFileViewerKind('font.woff2')).toBe('font')
    expect(detectFileViewerKind('bundle.zip')).toBe('archive')
  })

  it('handles special file names and dotfiles', () => {
    expect(detectFileViewerKind('Dockerfile')).toBe('code')
    expect(detectFileViewerKind('.gitignore')).toBe('code')
    expect(detectFileViewerKind('LICENSE')).toBe('text')
    expect(detectFileViewerKind('.env.local')).toBe('code')
  })

  it('falls back to MIME types and unknown formats', () => {
    expect(detectFileViewerKind('no-extension', 'image/png')).toBe('image')
    expect(detectFileViewerKind('payload', 'application/pdf')).toBe('pdf')
    expect(detectFileViewerKind('archive.bin', 'application/zip')).toBe('archive')
    expect(detectFileViewerKind('unknown.xyz')).toBe('unsupported')
    expect(detectFormat('unknown.xyz').supported).toBe(false)
  })

  it('prefers a precise MIME type for ambiguous extensions', () => {
    expect(detectFileViewerKind('stream.ts', 'text/plain')).toBe('code')
    expect(detectFileViewerKind('stream.ts', 'video/mp2t')).toBe('video')
    expect(detectFileViewerKind('sound.ogg', 'video/ogg')).toBe('video')
  })

  it('resolves MIME types and metadata', () => {
    expect(detectMimeType('photo.webp')).toBe('image/webp')
    const meta = toFileViewerMeta('report.docx', undefined, 2048)
    expect(meta).toMatchObject({
      name: 'report.docx',
      extension: 'docx',
      kind: 'document',
      label: 'Word',
      size: 2048,
      supported: true,
    })
  })

  it('exposes a format catalog', () => {
    expect(fileViewerFormatCatalog.length).toBeGreaterThan(10)
    expect(fileViewerFormatCatalog.some((format) => format.kind === 'pdf')).toBe(true)
  })
})
