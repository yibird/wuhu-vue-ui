import { describe, expect, it } from 'vite-plus/test'
import { resolveZipPath, ZipArchive } from '../core/zip'

function storedZip(files: Array<{ name: string; content: string }>): Uint8Array {
  const encoder = new TextEncoder()
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    const name = encoder.encode(file.name)
    const data = encoder.encode(file.content)
    const local = new Uint8Array(30 + name.length + data.length)
    const localView = new DataView(local.buffer)
    localView.setUint32(0, 0x04034b50, true)
    localView.setUint16(4, 20, true)
    localView.setUint16(6, 0, true)
    localView.setUint16(8, 0, true)
    localView.setUint16(10, 0, true)
    localView.setUint16(12, 0, true)
    localView.setUint32(14, 0, true)
    localView.setUint32(18, data.length, true)
    localView.setUint32(22, data.length, true)
    localView.setUint16(26, name.length, true)
    local.set(name, 30)
    local.set(data, 30 + name.length)
    locals.push(local)

    const central = new Uint8Array(46 + name.length)
    const centralView = new DataView(central.buffer)
    centralView.setUint32(0, 0x02014b50, true)
    centralView.setUint16(4, 20, true)
    centralView.setUint16(6, 20, true)
    centralView.setUint16(8, 0, true)
    centralView.setUint16(10, 0, true)
    centralView.setUint16(12, 0, true)
    centralView.setUint16(14, 0, true)
    centralView.setUint32(16, 0, true)
    centralView.setUint32(20, data.length, true)
    centralView.setUint32(24, data.length, true)
    centralView.setUint16(28, name.length, true)
    centralView.setUint32(42, offset, true)
    central.set(name, 46)
    centrals.push(central)

    offset += local.length
  }

  const centralSize = centrals.reduce((total, entry) => total + entry.length, 0)
  const eocd = new Uint8Array(22)
  const eocdView = new DataView(eocd.buffer)
  eocdView.setUint32(0, 0x06054b50, true)
  eocdView.setUint16(8, files.length, true)
  eocdView.setUint16(10, files.length, true)
  eocdView.setUint32(12, centralSize, true)
  eocdView.setUint32(16, offset, true)

  const result = new Uint8Array(offset + centralSize + eocd.length)
  let cursor = 0
  for (const local of locals) {
    result.set(local, cursor)
    cursor += local.length
  }
  for (const central of centrals) {
    result.set(central, cursor)
    cursor += central.length
  }
  result.set(eocd, cursor)
  return result
}

describe('ZIP reader', () => {
  it('lists and reads stored entries', async () => {
    const data = storedZip([
      { name: 'hello.txt', content: 'Hello archive' },
      { name: 'nested/data.json', content: '{"ok":true}' },
    ])
    const zip = await ZipArchive.open(data)
    expect(zip.entries.map((entry) => entry.name)).toEqual(['hello.txt', 'nested/data.json'])
    expect(zip.has('hello.txt')).toBe(true)
    expect(await zip.text('hello.txt')).toBe('Hello archive')
    expect(JSON.parse(await zip.text('nested/data.json'))).toEqual({ ok: true })
    const blob = await zip.blob('hello.txt', 'text/plain')
    expect(blob.type).toBe('text/plain')
    expect(await blob.text()).toBe('Hello archive')
  })

  it('throws for missing entries', async () => {
    const zip = await ZipArchive.open(storedZip([{ name: 'a.txt', content: 'a' }]))
    await expect(zip.read('missing.txt')).rejects.toThrow('not found')
  })

  it('resolves relative ZIP paths', () => {
    expect(resolveZipPath('word/document.xml', 'media/image1.png')).toBe('word/media/image1.png')
    expect(resolveZipPath('word/document.xml', '../media/image1.png')).toBe('media/image1.png')
    expect(resolveZipPath('OEBPS/content.opf', 'Text/chapter%201.xhtml')).toBe(
      'OEBPS/Text/chapter 1.xhtml',
    )
    expect(resolveZipPath('a/b.xml', 'https://example.com/x')).toBe('https://example.com/x')
  })
})
