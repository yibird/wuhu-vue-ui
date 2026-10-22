import { parseXml } from './xml'

const INLINE_ELEMENT = /^<([\w:.-]+)(?:\s[^>]*)?>[\s\S]*<\/\1>$/
const OPEN_ELEMENT = /^<[^!?/][^>]*>$/

/** Pretty-print XML for display. Returns null when the source is not valid XML. */
export function formatXml(source: string): string | null {
  try {
    const document = parseXml(source)
    let serialized = new XMLSerializer().serializeToString(document)
    serialized = serialized.replace(/>\s*</g, '>\n<').trim()
    const lines = serialized.split('\n')
    const output: string[] = []
    let depth = 0

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue

      const isClosing = line.startsWith('</')
      const isDeclaration = /^<[!?]/.test(line)
      const isSelfClosing = line.endsWith('/>')
      const isInline = INLINE_ELEMENT.test(line)
      const isOpen = !isDeclaration && !isClosing && !isSelfClosing && OPEN_ELEMENT.test(line)

      if (isClosing) depth = Math.max(0, depth - 1)
      output.push(`${'  '.repeat(depth)}${line}`)
      if (isOpen && !isInline) depth += 1
    }

    return output.join('\n')
  } catch {
    return null
  }
}

/** Collapse extremely long text for safe rendering. */
export function truncateText(
  source: string,
  maxBytes: number,
): { text: string; truncated: boolean } {
  if (maxBytes <= 0 || source.length * 3 <= maxBytes) return { text: source, truncated: false }

  // Binary search by UTF-8 byte length to avoid cutting surrogate pairs.
  let low = 0
  let high = source.length
  while (low < high) {
    const middle = Math.floor((low + high + 1) / 2)
    const byteLength = new TextEncoder().encode(source.slice(0, middle)).length
    if (byteLength <= maxBytes) low = middle
    else high = middle - 1
  }

  return { text: source.slice(0, low), truncated: low < source.length }
}
