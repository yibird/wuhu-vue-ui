import { describe, expect, it } from 'vite-plus/test'
import { escapeHtml, formatBytes, resolveUrl, sanitizeUrl, toCssSize } from '../core/format'
import { formatJson, stripJsonComments, stripTrailingCommas } from '../core/json'
import { formatXml } from '../core/text'
import { sanitizeHtml } from '../core/sanitize'

describe('format utilities', () => {
  it('escapes HTML and formats sizes', () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1024 * 1024 * 3)).toBe('3 MB')
    expect(formatBytes(undefined)).toBeUndefined()
    expect(toCssSize(320)).toBe('320px')
    expect(toCssSize('50%')).toBe('50%')
  })

  it('sanitizes URLs', () => {
    expect(sanitizeUrl('https://example.com/a')).toBe('https://example.com/a')
    expect(sanitizeUrl('mailto:a@b.com')).toBe('mailto:a@b.com')
    expect(sanitizeUrl('#section')).toBe('#section')
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull()
    expect(sanitizeUrl('java\nscript:alert(1)')).toBeNull()
    expect(sanitizeUrl('blob:https://example.com/id', { allowBlob: true })).toBe(
      'blob:https://example.com/id',
    )
    expect(sanitizeUrl('data:image/png;base64,iVBORw0KGgo=', { allowDataImage: true })).toBe(
      'data:image/png;base64,iVBORw0KGgo=',
    )
    expect(sanitizeUrl('data:text/html;base64,PHNjcmlwdD4=', { allowDataImage: true })).toBeNull()
  })

  it('resolves relative bases against the document URL', () => {
    const documentBase = window.location.href
    expect(resolveUrl('/samples/banner.png', '/samples/')).toBe(
      new URL('/samples/banner.png', documentBase).href,
    )
    expect(resolveUrl('banner.png', '/samples/')).toBe(
      new URL('/samples/banner.png', documentBase).href,
    )
    expect(resolveUrl('https://cdn.example.com/x.png', '/samples/')).toBe(
      'https://cdn.example.com/x.png',
    )
    expect(resolveUrl('banner.png', 'https://example.com/docs/')).toBe(
      'https://example.com/docs/banner.png',
    )
  })

  it('formats JSONC and XML', () => {
    expect(stripJsonComments('{\n // note\n "a": 1, /* block */\n}')).toContain('"a": 1')
    expect(stripTrailingCommas('{"a": [1, 2,],}')).toBe('{"a": [1, 2]}')
    const json = formatJson('{ // comment\n "a": [1,2,],\n}')
    expect(json.ok).toBe(true)
    expect(json.text).toContain('"a"')

    const xml = formatXml('<root><child a="1">text</child></root>')
    expect(xml).toContain('<root>')
    expect(xml).toContain('  <child a="1">text</child>')
    expect(formatXml('<not valid')).toBeNull()
  })

  it('sanitizes arbitrary HTML', () => {
    const html = sanitizeHtml(
      '<p onclick="alert(1)">Hello <a href="javascript:alert(1)">link</a><script>bad()</script><img src="https://example.com/a.png"></p>',
    )
    expect(html).toContain('Hello')
    expect(html).not.toContain('onclick')
    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('<script')
    expect(html).toContain('https://example.com/a.png')
  })
})
