export interface CsvParseOptions {
  delimiter?: string
  maxRows?: number
}

export interface CsvParseResult {
  rows: string[][]
  delimiter: string
  truncated: boolean
}

const CANDIDATES = [',', '\t', ';', '|']

export function detectCsvDelimiter(source: string): string {
  const lines = source
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .slice(0, 12)
  if (lines.length === 0) return ','

  const firstLine = lines[0] ?? ''
  const declared = /^sep=(.)\s*$/i.exec(firstLine)
  if (declared) return declared[1] ?? ','

  const scores = new Map<string, number>()
  for (const delimiter of CANDIDATES) {
    let score = 0
    for (const line of lines) {
      let count = 0
      let quoted = false
      for (let index = 0; index < line.length; index += 1) {
        const character = line[index]
        if (character === '"') {
          if (quoted && line[index + 1] === '"') index += 1
          else quoted = !quoted
        } else if (character === delimiter && !quoted) {
          count += 1
        }
      }
      if (count > 0) score += count
    }
    scores.set(delimiter, score)
  }

  let best = ','
  let bestScore = -1
  for (const [delimiter, score] of scores) {
    if (score > bestScore) {
      best = delimiter
      bestScore = score
    }
  }
  return bestScore > 0 ? best : ','
}

export function parseCsv(source: string, options: CsvParseOptions = {}): CsvParseResult {
  let text = source.replace(/^\uFEFF/, '')
  let delimiter = options.delimiter ?? ''

  if (!delimiter) {
    delimiter = detectCsvDelimiter(text)
    const declared = /^sep=(.)\r?\n/i.exec(text)
    if (declared) text = text.slice(declared[0].length)
  }

  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  let truncated = false

  const finishRow = (): boolean => {
    row.push(cell)
    rows.push(row)
    row = []
    cell = ''
    return rows.length < maxRows
  }

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]

    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        cell += character
      }
      continue
    }

    if (character === '"') {
      quoted = true
      continue
    }

    if (character === delimiter) {
      row.push(cell)
      cell = ''
      continue
    }

    if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      if (!finishRow()) {
        truncated = index + 1 < text.length
        break
      }
      continue
    }

    cell += character
  }

  if (!truncated && (cell.length > 0 || row.length > 0)) {
    row.push(cell)
    rows.push(row)
  }

  return { rows, delimiter, truncated }
}
