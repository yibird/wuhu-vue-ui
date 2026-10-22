import { describe, expect, it } from 'vite-plus/test'
import { highlightCodeToHtml, tokenizeCode, tokensToLines } from '../core/code'

describe('code highlighting', () => {
  it('highlights JavaScript tokens', () => {
    const html = highlightCodeToHtml(
      '// note\nconst answer = 42\nconsole.log("hello")',
      'javascript',
    )
    expect(html).toContain('w-file-viewer__token--comment')
    expect(html).toContain('w-file-viewer__token--keyword')
    expect(html).toContain('w-file-viewer__token--number')
    expect(html).toContain('w-file-viewer__token--string')
    expect(html).toContain('w-file-viewer__token--builtin')
  })

  it('highlights markup tags and attributes', () => {
    const html = highlightCodeToHtml('<div class="box">Hi</div>', 'html')
    expect(html).toContain('w-file-viewer__token--tag')
    expect(html).toContain('w-file-viewer__token--attr')
    expect(html).toContain('w-file-viewer__token--string')
  })

  it('splits tokens into lines without losing text', () => {
    const tokens = tokenizeCode('const a = 1\n/* x */\nconst b = 2', 'typescript')
    const lines = tokensToLines(tokens)
    expect(lines).toHaveLength(3)
    expect(lines.map((line) => line.map((token) => token.text).join('')).join('\n')).toContain(
      'const a = 1',
    )
  })

  it('supports diffs and plain text', () => {
    const lines = tokensToLines(tokenizeCode('+added\n-removed\n@@ hunk', 'diff'))
    expect(lines[0]?.some((token) => token.type === 'added')).toBe(true)
    expect(lines[1]?.some((token) => token.type === 'removed')).toBe(true)
    expect(tokenizeCode('plain text', 'plaintext')).toEqual([{ text: 'plain text', type: 'plain' }])
  })
})
