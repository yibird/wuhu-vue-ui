import { highlightCodeToHtml } from './code'
import { escapeAttribute, escapeHtml, sanitizeUrl } from './format'

export interface MarkdownRenderOptions {
  baseUrl?: string
}

const LIST_ITEM = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/
const BLOCK_START =
  /^(?: {0,3}(?:#{1,6}\s|>|```|~~~|([-*+]|\d{1,9}[.)])\s|(?:[-*_]\s*){3,}$)| {0,3}\|?.+\|.+\s*$)/

function isBlank(line: string): boolean {
  return line.trim().length === 0
}

function isTableSeparator(line: string): boolean {
  const cells = splitTableRow(line)
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
}

function splitTableRow(line: string): string[] {
  let text = line.trim()
  if (text.startsWith('|')) text = text.slice(1)
  if (text.endsWith('|') && !text.endsWith('\\|')) text = text.slice(0, -1)

  const cells: string[] = []
  let current = ''
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '\\' && text[index + 1] === '|') {
      current += '|'
      index += 1
      continue
    }
    if (character === '|') {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += character
  }
  cells.push(current.trim())
  return cells
}

function decodeUrl(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function renderLink(
  label: string,
  url: string,
  title: string | undefined,
  options: MarkdownRenderOptions,
  image: boolean,
): string {
  const safe = sanitizeUrl(decodeUrl(url), {
    base: options.baseUrl,
    allowDataImage: image,
  })
  if (!safe) return image ? label : label
  if (image) {
    return `<img src="${escapeAttribute(safe)}" alt="${escapeAttribute(label)}"${
      title ? ` title="${escapeAttribute(title)}"` : ''
    } loading="lazy" />`
  }

  const external = /^https?:\/\//i.test(safe)
  return `<a href="${escapeAttribute(safe)}"${title ? ` title="${escapeAttribute(title)}"` : ''}${
    external ? ' target="_blank" rel="noopener noreferrer"' : ''
  }>${label}</a>`
}

export function renderMarkdown(source: string, options: MarkdownRenderOptions = {}): string {
  const normalized = source.replace(/\r\n?/g, '\n')
  return renderBlocks(normalized.split('\n'), options)
}

const MAX_BLOCK_DEPTH = 32

function renderBlocks(lines: string[], options: MarkdownRenderOptions, depth = 0): string {
  if (depth > MAX_BLOCK_DEPTH) {
    return `<p>${escapeHtml(lines.join('\n'))}</p>\n`
  }

  let html = ''
  let index = 0

  while (index < lines.length) {
    const line = lines[index] ?? ''

    if (isBlank(line)) {
      index += 1
      continue
    }

    const fence = /^ {0,3}(`{3,}|~{3,})[ \t]*([^\s`]*)[ \t]*$/.exec(line)
    if (fence) {
      const marker = fence[1] ?? '```'
      const character = marker[0] ?? '`'
      const minimumLength = marker.length
      const language = fence[2] ?? ''
      const code: string[] = []
      index += 1
      while (index < lines.length) {
        const current = lines[index] ?? ''
        const closing = new RegExp(`^ {0,3}\\${character}{${minimumLength},}\\s*$`)
        if (closing.test(current)) {
          index += 1
          break
        }
        code.push(current)
        index += 1
      }
      const languageClass = language ? ` class="language-${escapeAttribute(language)}"` : ''
      html += `<pre class="w-file-viewer__md-pre" tabindex="0"><code${languageClass}>${highlightCodeToHtml(
        code.join('\n'),
        language || 'plaintext',
      )}</code></pre>\n`
      continue
    }

    const heading = /^ {0,3}(#{1,6})(?:\s+(.*?))?\s*#*\s*$/.exec(line)
    if (heading) {
      const level = (heading[1] ?? '#').length
      html += `<h${level}>${renderInline(heading[2] ?? '', options)}</h${level}>\n`
      index += 1
      continue
    }

    if (
      index + 1 < lines.length &&
      !isBlank(line) &&
      /^ {0,3}(=+|-+)\s*$/.test(lines[index + 1] ?? '')
    ) {
      const level = (lines[index + 1] ?? '').trim().startsWith('=') ? 1 : 2
      html += `<h${level}>${renderInline(line.trim(), options)}</h${level}>\n`
      index += 2
      continue
    }

    if (/^ {0,3}((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})$/.test(line)) {
      html += '<hr />\n'
      index += 1
      continue
    }

    if (/^ {0,3}>/.test(line)) {
      const quote: string[] = []
      while (index < lines.length) {
        const current = lines[index] ?? ''
        if (/^ {0,3}>/.test(current)) {
          quote.push(current.replace(/^ {0,3}> ?/, ''))
          index += 1
          continue
        }
        if (isBlank(current)) {
          let lookahead = index + 1
          while (lookahead < lines.length && isBlank(lines[lookahead] ?? '')) lookahead += 1
          if (lookahead < lines.length && /^ {0,3}>/.test(lines[lookahead] ?? '')) {
            quote.push('')
            index += 1
            continue
          }
        }
        break
      }
      html += `<blockquote>\n${renderBlocks(quote, options, depth + 1)}</blockquote>\n`
      continue
    }

    if (
      line.includes('|') &&
      index + 1 < lines.length &&
      isTableSeparator(lines[index + 1] ?? '')
    ) {
      const header = splitTableRow(line)
      const separators = splitTableRow(lines[index + 1] ?? '')
      const alignments = separators.map((cell) => {
        const trimmed = cell.trim()
        const left = trimmed.startsWith(':')
        const right = trimmed.endsWith(':')
        if (left && right) return 'center'
        if (right) return 'right'
        if (left) return 'left'
        return ''
      })
      index += 2

      const rows: string[][] = []
      while (
        index < lines.length &&
        (lines[index] ?? '').includes('|') &&
        !isBlank(lines[index] ?? '')
      ) {
        rows.push(splitTableRow(lines[index] ?? ''))
        index += 1
      }

      const renderRow = (cells: string[], tag: 'th' | 'td') =>
        cells
          .map((cell, cellIndex) => {
            const alignment = alignments[cellIndex]
            return `<${tag}${alignment ? ` style="text-align:${alignment}"` : ''}>${renderInline(
              cell,
              options,
            )}</${tag}>`
          })
          .join('')

      html += '<div class="w-file-viewer__md-table-wrap"><table><thead><tr>'
      html += renderRow(header, 'th')
      html += '</tr></thead><tbody>'
      for (const row of rows) {
        html += `<tr>${renderRow(row, 'td')}</tr>`
      }
      html += '</tbody></table></div>\n'
      continue
    }

    if (LIST_ITEM.test(line)) {
      const result = parseList(lines, index, options, depth)
      html += result.html
      index = result.next
      continue
    }

    // Paragraph.
    const paragraph: string[] = [line]
    index += 1
    while (index < lines.length) {
      const current = lines[index] ?? ''
      if (isBlank(current) || BLOCK_START.test(current)) break
      paragraph.push(current)
      index += 1
    }
    html += `<p>${renderInline(paragraph.join('\n'), options)}</p>\n`
  }

  return html
}

function parseList(
  lines: string[],
  start: number,
  options: MarkdownRenderOptions,
  depth = 0,
): { html: string; next: number } {
  const first = LIST_ITEM.exec(lines[start] ?? '')
  if (!first) return { html: '', next: start + 1 }

  const ordered = /\d/.test(first[2] ?? '')
  const baseIndent = (first[1] ?? '').length
  const startNumber = ordered ? Number.parseInt(first[2] ?? '1', 10) : 1
  const items: string[][] = []
  let current: string[] | null = null
  let index = start

  while (index < lines.length) {
    const line = lines[index] ?? ''

    if (isBlank(line)) {
      let lookahead = index + 1
      while (lookahead < lines.length && isBlank(lines[lookahead] ?? '')) lookahead += 1
      if (lookahead >= lines.length) {
        index = lookahead
        break
      }
      const nextLine = lines[lookahead] ?? ''
      const nextItem = LIST_ITEM.exec(nextLine)
      const nextIndent = (nextItem?.[1] ?? '').length
      const belongs = (nextItem && nextIndent >= baseIndent) || nextIndent > baseIndent
      if (current && belongs) {
        current.push('')
        index += 1
        continue
      }
      break
    }

    const item = LIST_ITEM.exec(line)
    if (item) {
      const indent = (item[1] ?? '').length
      if (indent <= baseIndent + 1) {
        if (indent < baseIndent) break
        current = [item[3] ?? '']
        items.push(current)
        index += 1
        continue
      }
      if (current) {
        current.push(line.slice(Math.min(line.length, baseIndent + 2)))
        index += 1
        continue
      }
    }

    const indent = /^\s*/.exec(line)?.[0].length ?? 0
    if (indent > baseIndent && current) {
      current.push(line.slice(Math.min(line.length, baseIndent + 2)))
      index += 1
      continue
    }

    break
  }

  const tag = ordered ? 'ol' : 'ul'
  const startAttribute = ordered && startNumber !== 1 ? ` start="${startNumber}"` : ''
  let html = `<${tag}${startAttribute}>\n`

  for (const item of items) {
    let content = item.slice()
    const task = /^\[([ xX])\]\s+([\s\S]*)$/.exec(content[0] ?? '')
    let checkbox = ''
    if (task) {
      const checked = (task[1] ?? '').toLowerCase() === 'x'
      checkbox = `<input type="checkbox" disabled tabindex="-1" aria-hidden="true"${checked ? ' checked' : ''} /> `
      content = [task[2] ?? '', ...content.slice(1)]
    }

    let rendered = renderBlocks(content, options, depth + 1)
    if (rendered.startsWith('<p>') && rendered.endsWith('</p>\n')) {
      rendered = rendered.slice(3, -5)
    }

    html += `<li>${checkbox}${rendered}</li>\n`
  }

  html += `</${tag}>\n`
  return { html, next: index }
}

function renderInline(source: string, options: MarkdownRenderOptions): string {
  const placeholders: string[] = []
  const store = (html: string): string => {
    const token = `\uE000MD${placeholders.length}\uE001`
    placeholders.push(html)
    return token
  }

  let text = escapeHtml(source)

  // Backslash escapes become protected literals.
  text = text.replace(/\\([\\`*_{}[\]()#+\-.!~>|])/g, (_match, character: string) =>
    store(escapeHtml(character)),
  )

  // Code spans first so their contents are never interpreted.
  text = text.replace(/`([^`\n]+)`/g, (_match, code: string) => store(`<code>${code}</code>`))

  // Images and links.
  text = text.replace(
    /(!?)\[([^\]]*)\]\(\s*([^\s)]*)(?:\s+["']([^"']*)["'])?\s*\)/g,
    (_match, bang: string, label: string, url: string, title: string | undefined) =>
      store(renderLink(label, url, title, options, Boolean(bang))),
  )

  // Autolinks.
  text = text.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, (_match, url: string) =>
    store(renderLink(escapeHtml(url), url, undefined, options, false)),
  )

  text = text.replace(/&lt;([^\s@]+@[^\s@]+\.[^\s@]+)&gt;/g, (_match, address: string) =>
    store(`<a href="mailto:${escapeAttribute(address)}">${address}</a>`),
  )

  text = text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<![\w])_([^_\n]+)_(?![\w])/g, '<em>$1</em>')
    .replace(/ {2,}\n/g, '<br />\n')

  text = text.replace(/\uE000MD(\d+)\uE001/g, (_match, index: string) => {
    return placeholders[Number(index)] ?? ''
  })

  return text
}
