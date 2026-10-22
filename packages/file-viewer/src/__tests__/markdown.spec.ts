import { describe, expect, it } from 'vite-plus/test'
import { renderMarkdown } from '../core/markdown'

describe('Markdown renderer', () => {
  it('renders headings, emphasis, lists and tables', () => {
    const html = renderMarkdown(
      '# Title\n\nSome **bold** and *italic* text.\n\n- one\n- two\n\n| A | B |\n| --- | --- |\n| 1 | 2 |',
    )
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
    expect(html).toContain('<li>one</li>')
    expect(html).toContain('<table>')
    expect(html).toContain('<th>A</th>')
  })

  it('renders fenced code with escaping', () => {
    const html = renderMarkdown('```html\n<div class="x">Hello</div>\n```')
    expect(html).toContain('<pre')
    expect(html).toContain('&lt;')
    expect(html).toContain('w-file-viewer__token--tag')
    expect(html).not.toContain('<div class="x">')
  })

  it('escapes raw HTML and blocks javascript URLs', () => {
    const html = renderMarkdown(
      '<script>alert(1)</script>\n\n[click](javascript:alert(1))\n\n![x](javascript:alert(1))',
    )
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('href="javascript:')
    expect(html).not.toContain('src="javascript:')
    expect(html).toContain('click')
  })

  it('sanitizes event handlers and resolves relative URLs with a base', () => {
    const html = renderMarkdown('<img src=x onerror=alert(1)>', {
      baseUrl: 'https://example.com/docs/',
    })
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
    const linked = renderMarkdown('[docs](guide.md)', { baseUrl: 'https://example.com/docs/' })
    expect(linked).toContain('href="https://example.com/docs/guide.md"')
  })

  it('resolves images and links with a relative baseUrl', () => {
    const origin = window.location.origin
    const image = renderMarkdown('![banner](banner.png)', { baseUrl: '/samples/' })
    expect(image).toContain(`<img src="${origin}/samples/banner.png"`)
    expect(image).toContain('alt="banner"')

    const absolutePath = renderMarkdown('![banner](/samples/banner.png)', {
      baseUrl: '/samples/',
    })
    expect(absolutePath).toContain(`<img src="${origin}/samples/banner.png"`)

    const link = renderMarkdown('[guide](guide.md)', { baseUrl: '/samples/' })
    expect(link).toContain(`href="${origin}/samples/guide.md"`)
  })

  it('supports task lists, blockquotes and nested lists', () => {
    const html = renderMarkdown('> quote\n\n- [x] done\n- [ ] todo\n  - nested')
    expect(html).toContain('<blockquote>')
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('checked')
    expect(html).toContain('<li>nested</li>')
  })

  it('does not leak internal placeholders', () => {
    const html = renderMarkdown('`code` and [link](https://example.com) and **bold**')
    expect(html).not.toContain('\uE000')
    expect(html).toContain('<code>code</code>')
    expect(html).toContain('https://example.com')
  })
})
