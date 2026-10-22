export interface JsonFormatResult {
  ok: boolean
  text: string
  error?: string
}

/** Remove `//` and block comments without touching string contents. */
export function stripJsonComments(source: string): string {
  let output = ''
  let quote: string | null = null
  let escaped = false

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index] ?? ''
    const next = source[index + 1] ?? ''

    if (quote) {
      output += character
      if (escaped) {
        escaped = false
      } else if (character === '\\') {
        escaped = true
      } else if (character === quote) {
        quote = null
      }
      continue
    }

    if (character === '"' || character === "'") {
      quote = character
      output += character
      continue
    }

    if (character === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') index += 1
      output += '\n'
      continue
    }

    if (character === '/' && next === '*') {
      index += 2
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index += 1
      }
      index += 1
      continue
    }

    output += character
  }

  return output
}

/** Remove trailing commas before `}` / `]` outside strings. */
export function stripTrailingCommas(source: string): string {
  let output = ''
  let quote: string | null = null
  let escaped = false

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index] ?? ''

    if (quote) {
      output += character
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = null
      continue
    }

    if (character === '"' || character === "'") {
      quote = character
      output += character
      continue
    }

    if (character === ',') {
      let lookahead = index + 1
      while (lookahead < source.length && /\s/.test(source[lookahead] ?? '')) lookahead += 1
      if (source[lookahead] === '}' || source[lookahead] === ']') continue
    }

    output += character
  }

  return output
}

export function formatJson(source: string): JsonFormatResult {
  const cleaned = stripTrailingCommas(stripJsonComments(source))
  try {
    const value: unknown = JSON.parse(cleaned)
    return { ok: true, text: JSON.stringify(value, null, 2) }
  } catch (error) {
    return {
      ok: false,
      text: source,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    }
  }
}
