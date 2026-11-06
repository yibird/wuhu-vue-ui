import { escapeAttribute, escapeHtml, sanitizeUrl } from './format'
import { readOfficeTitle } from './office-utils'
import { readRelationships } from './relationships'
import type { ZipReaderLike } from './zip'
import {
  RELATIONSHIP_NS,
  attribute,
  attributeNS,
  children,
  descendants,
  firstChild,
  firstDescendant,
  parseXml,
  value,
} from './xml'

export interface XlsxSheet {
  name: string
  html: string
  rowCount: number
  columnCount: number
  truncated: boolean
}

export interface XlsxParseResult {
  title?: string
  sheets: XlsxSheet[]
}

export interface XlsxParseOptions {
  maxRows?: number
  maxColumns?: number
  showGrid?: boolean
  locale?: string
}

interface FontSpec {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  color?: string
  size?: number
  name?: string
}

interface BorderSide {
  style?: string
  color?: string
}

interface BorderSpec {
  left?: BorderSide
  right?: BorderSide
  top?: BorderSide
  bottom?: BorderSide
}

interface AlignmentSpec {
  horizontal?: string
  vertical?: string
  wrapText?: boolean
}

interface CellXf {
  numFmtId: number
  fontId: number
  fillId: number
  borderId: number
  alignment?: AlignmentSpec
}

interface Styles {
  numFmts: Map<number, string>
  fonts: FontSpec[]
  fills: string[]
  borders: BorderSpec[]
  cellXfs: CellXf[]
}

interface CellData {
  row: number
  col: number
  text: string
  rawType: 'number' | 'date' | 'text' | 'boolean' | 'error'
  styleIndex: number
  formula?: string
  href?: string
}

interface MergeRange {
  top: number
  left: number
  bottom: number
  right: number
}

const BUILTIN_FORMATS: Record<number, string> = {
  0: 'General',
  1: '0',
  2: '0.00',
  3: '#,##0',
  4: '#,##0.00',
  9: '0%',
  10: '0.00%',
  11: '0.00E+00',
  12: '# ?/?',
  13: '# ??/??',
  14: 'mm-dd-yy',
  15: 'd-mmm-yy',
  16: 'd-mmm',
  17: 'mmm-yy',
  18: 'h:mm AM/PM',
  19: 'h:mm:ss AM/PM',
  20: 'h:mm',
  21: 'h:mm:ss',
  22: 'm/d/yy h:mm',
  37: '#,##0 ;(#,##0)',
  38: '#,##0 ;[Red](#,##0)',
  39: '#,##0.00;(#,##0.00)',
  40: '#,##0.00;[Red](#,##0.00)',
  45: 'mm:ss',
  46: '[h]:mm:ss',
  47: 'mmss.0',
  48: '##0.0E+0',
  49: '@',
}

const DATE_FORMAT_IDS = new Set([
  14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47, 50, 51,
  52, 53, 54, 55, 56, 57, 58,
])

const THEME_COLORS = [
  '#ffffff',
  '#000000',
  '#eeece1',
  '#1f497d',
  '#4f81bd',
  '#c0504d',
  '#9bbb59',
  '#8064a2',
  '#4bacc6',
  '#f79646',
  '#0000ff',
  '#800080',
]

const HORIZONTAL_ALIGNMENTS = new Set(['left', 'center', 'right', 'justify', 'fill'])
const VERTICAL_ALIGNMENTS = new Set(['top', 'center', 'bottom'])

function normalizeHorizontalAlignment(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (value === 'centerContinuous') return 'center'
  return HORIZONTAL_ALIGNMENTS.has(value) ? value : undefined
}

function normalizeVerticalAlignment(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (!VERTICAL_ALIGNMENTS.has(value)) return undefined
  return value === 'center' ? 'middle' : value
}

const BORDER_STYLES: Record<string, string> = {
  thin: '1px solid',
  medium: '2px solid',
  thick: '3px solid',
  dashed: '1px dashed',
  dotted: '1px dotted',
  double: '3px double',
  hair: '1px solid',
  mediumDashed: '2px dashed',
  dashDot: '1px dashed',
  mediumDashDot: '2px dashed',
  dashDotDot: '1px dashed',
  mediumDashDotDot: '2px dashed',
  slantDashDot: '1px dashed',
}

function colorValue(element: Element | undefined): string | undefined {
  if (!element) return undefined
  const rgb = attribute(element, 'rgb')
  if (rgb && /^[0-9a-f]{6,8}$/i.test(rgb)) return `#${rgb.slice(-6)}`
  const theme = attribute(element, 'theme')
  if (theme) {
    const index = Number.parseInt(theme, 10)
    const color = THEME_COLORS[index]
    if (color) return color
  }
  const indexed = attribute(element, 'indexed')
  if (indexed) {
    const index = Number.parseInt(indexed, 10)
    if (index === 64) return undefined
    const system: Record<number, string> = {
      0: '#000000',
      1: '#ffffff',
      2: '#ff0000',
      3: '#00ff00',
      4: '#0000ff',
      5: '#ffff00',
      6: '#ff00ff',
      7: '#00ffff',
      8: '#000000',
      9: '#ffffff',
      10: '#ff0000',
      11: '#00ff00',
      12: '#0000ff',
      13: '#ffff00',
      14: '#ff00ff',
      15: '#00ffff',
    }
    return system[index]
  }
  return undefined
}

function columnToNumber(letters: string): number {
  // Excel columns are at most three letters (XFD = 16384).
  if (letters.length > 3) return Number.NaN
  let value = 0
  for (const letter of letters.toUpperCase()) {
    const code = letter.charCodeAt(0)
    if (code < 65 || code > 90) continue
    value = value * 26 + (code - 64)
  }
  return value
}

function numberToColumn(value: number): string {
  if (!Number.isFinite(value) || value < 1) return 'A'
  let remaining = Math.floor(value)
  let output = ''
  while (remaining > 0) {
    remaining -= 1
    output = String.fromCharCode(65 + (remaining % 26)) + output
    remaining = Math.floor(remaining / 26)
  }
  return output || 'A'
}

function parseReference(reference: string | undefined): { row: number; col: number } | undefined {
  if (!reference) return undefined
  const match = /^\$?([A-Za-z]+)\$?(\d+)$/.exec(reference.trim())
  if (!match) return undefined
  const col = columnToNumber(match[1] ?? 'A')
  const row = Number.parseInt(match[2] ?? '1', 10)
  // Guard against malformed references that would overflow layout math.
  if (!Number.isFinite(col) || col < 1 || col > 16384) return undefined
  if (!Number.isFinite(row) || row < 1 || row > 1048576) return undefined
  return { col, row }
}

function parseRange(reference: string | undefined): MergeRange | undefined {
  if (!reference) return undefined
  const [start, end] = reference.split(':')
  const topLeft = parseReference(start)
  const bottomRight = parseReference(end ?? start)
  if (!topLeft || !bottomRight) return undefined
  return {
    top: Math.min(topLeft.row, bottomRight.row),
    left: Math.min(topLeft.col, bottomRight.col),
    bottom: Math.max(topLeft.row, bottomRight.row),
    right: Math.max(topLeft.col, bottomRight.col),
  }
}

function textContentOf(element: Element | undefined): string {
  if (!element) return ''
  return element.textContent ?? ''
}

async function readSharedStrings(zip: ZipReaderLike): Promise<string[]> {
  if (!zip.has('xl/sharedStrings.xml')) return []
  try {
    const document = parseXml(await zip.text('xl/sharedStrings.xml'))
    return descendants(document, 'si').map((item) =>
      descendants(item, 't')
        .map((text) => text.textContent ?? '')
        .join(''),
    )
  } catch {
    return []
  }
}

async function readStyles(zip: ZipReaderLike): Promise<Styles> {
  const styles: Styles = {
    numFmts: new Map(),
    fonts: [],
    fills: [],
    borders: [],
    cellXfs: [],
  }

  if (!zip.has('xl/styles.xml')) return styles

  try {
    const document = parseXml(await zip.text('xl/styles.xml'))

    for (const element of descendants(document, 'numFmt')) {
      const id = Number.parseInt(attribute(element, 'numFmtId') ?? '', 10)
      const code = attribute(element, 'formatCode')
      if (Number.isFinite(id) && code) styles.numFmts.set(id, code)
    }

    const fontsRoot = firstDescendant(document, 'fonts')
    for (const font of fontsRoot ? children(fontsRoot, 'font') : []) {
      styles.fonts.push({
        bold: Boolean(firstChild(font, 'b')),
        italic: Boolean(firstChild(font, 'i')),
        underline: Boolean(firstChild(font, 'u')),
        strike: Boolean(firstChild(font, 'strike')),
        color: colorValue(firstChild(font, 'color')),
        size: Number.parseFloat(value(firstChild(font, 'sz')) ?? '') || undefined,
        name: value(firstChild(font, 'name')),
      })
    }

    const fillsRoot = firstDescendant(document, 'fills')
    for (const fill of fillsRoot ? children(fillsRoot, 'fill') : []) {
      const pattern = firstChild(fill, 'patternFill')
      if (!pattern) {
        styles.fills.push('')
        continue
      }
      const patternType = attribute(pattern, 'patternType')
      if (patternType === 'solid') {
        styles.fills.push(colorValue(firstChild(pattern, 'fgColor')) ?? '')
      } else {
        styles.fills.push('')
      }
    }

    const bordersRoot = firstDescendant(document, 'borders')
    for (const border of bordersRoot ? children(bordersRoot, 'border') : []) {
      const parseSide = (name: string): BorderSide => {
        const side = firstChild(border, name)
        return {
          style: side ? attribute(side, 'style') : undefined,
          color: side ? colorValue(firstChild(side, 'color')) : undefined,
        }
      }
      styles.borders.push({
        left: parseSide('left'),
        right: parseSide('right'),
        top: parseSide('top'),
        bottom: parseSide('bottom'),
      })
    }

    const xfsRoot = firstDescendant(document, 'cellXfs')
    for (const xf of xfsRoot ? children(xfsRoot, 'xf') : []) {
      const alignment = firstChild(xf, 'alignment')
      styles.cellXfs.push({
        numFmtId: Number.parseInt(attribute(xf, 'numFmtId') ?? '0', 10) || 0,
        fontId: Number.parseInt(attribute(xf, 'fontId') ?? '0', 10) || 0,
        fillId: Number.parseInt(attribute(xf, 'fillId') ?? '0', 10) || 0,
        borderId: Number.parseInt(attribute(xf, 'borderId') ?? '0', 10) || 0,
        alignment: alignment
          ? {
              horizontal: normalizeHorizontalAlignment(attribute(alignment, 'horizontal')),
              vertical: normalizeVerticalAlignment(attribute(alignment, 'vertical')),
              wrapText: attribute(alignment, 'wrapText') === '1',
            }
          : undefined,
      })
    }
  } catch {
    // Keep the partial styles we managed to read.
  }

  return styles
}

function splitSections(code: string): string[] {
  const sections: string[] = []
  let current = ''
  let quoted = false
  let bracket = 0

  for (let index = 0; index < code.length; index += 1) {
    const character = code[index] ?? ''
    if (character === '"') quoted = !quoted
    else if (!quoted && character === '[') bracket += 1
    else if (!quoted && character === ']') bracket = Math.max(0, bracket - 1)

    if (character === ';' && !quoted && bracket === 0) {
      sections.push(current)
      current = ''
      continue
    }
    current += character
  }
  sections.push(current)
  return sections
}

function isDateFormat(section: string): boolean {
  const cleaned = section
    .replace(/"[^"]*"/g, '')
    .replace(/\\./g, '')
    .replace(/_.?/g, '')
    .replace(/\*.?/g, '')
    .replace(/AM\/PM|A\/P/gi, '')
    .replace(/\[(?!h+\]|m+\]|s+\])[^\]]*\]/gi, '')
  return /[ymdhs]/i.test(cleaned)
}

function pad(value: number, length = 2): string {
  return String(Math.trunc(Math.abs(value))).padStart(length, '0')
}

function excelSerialToDate(serial: number, date1904: boolean): Date {
  const base = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30)
  return new Date(base + serial * 86400000)
}

function formatDatePart(
  date: Date,
  token: string,
  runLength: number,
  locale: string,
  use12Hour: boolean,
): string {
  switch (token) {
    case 'y': {
      const year = date.getUTCFullYear()
      return runLength <= 2 ? pad(year % 100, 2) : String(year).padStart(4, '0')
    }
    case 'd': {
      if (runLength >= 4) {
        return new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(date)
      }
      if (runLength === 3) {
        return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(date)
      }
      return runLength === 2 ? pad(date.getUTCDate(), 2) : String(date.getUTCDate())
    }
    case 'h': {
      const hours = date.getUTCHours()
      const display = use12Hour ? hours % 12 || 12 : hours
      return runLength >= 2 ? pad(display, 2) : String(display)
    }
    case 's': {
      const seconds = date.getUTCSeconds()
      return runLength >= 2 ? pad(seconds, 2) : String(seconds)
    }
    default:
      return ''
  }
}

function formatMonth(date: Date, runLength: number, locale: string, minutes: boolean): string {
  if (minutes) return runLength >= 2 ? pad(date.getUTCMinutes(), 2) : String(date.getUTCMinutes())
  const month = date.getUTCMonth()
  if (runLength >= 5) {
    return new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' })
      .format(date)
      .slice(0, 1)
  }
  if (runLength === 4) {
    return new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(date)
  }
  if (runLength === 3) {
    return new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(date)
  }
  return runLength === 2 ? pad(month + 1, 2) : String(month + 1)
}

function formatExcelDate(date: Date, code: string, locale: string, serial: number): string {
  const use12Hour = /AM\/PM|A\/P/i.test(code)
  let output = ''
  let lastToken = ''
  let index = 0

  while (index < code.length) {
    const character = code[index] ?? ''

    if (character === '"') {
      const end = code.indexOf('"', index + 1)
      output += code.slice(index + 1, end < 0 ? code.length : end)
      index = end < 0 ? code.length : end + 1
      continue
    }

    if (character === '\\') {
      output += code[index + 1] ?? ''
      index += 2
      continue
    }

    if (character === '_') {
      output += ' '
      index += 2
      continue
    }

    if (character === '*') {
      index += 2
      continue
    }

    if (character === '[') {
      const end = code.indexOf(']', index + 1)
      const content = code.slice(index + 1, end < 0 ? code.length : end)
      if (/^h+$/i.test(content)) output += pad(Math.floor(serial * 24), content.length)
      else if (/^m+$/i.test(content)) output += pad(Math.floor(serial * 1440), content.length)
      else if (/^s+$/i.test(content)) output += pad(Math.floor(serial * 86400), content.length)
      index = end < 0 ? code.length : end + 1
      continue
    }

    if (/[ymdhs]/i.test(character)) {
      let end = index + 1
      while (end < code.length && (code[end] ?? '').toLowerCase() === character.toLowerCase()) {
        end += 1
      }
      const runLength = end - index
      const token = character.toLowerCase()

      if (token === 'm') {
        let minutes = lastToken === 'h'

        if (!minutes) {
          let lookahead = end
          while (lookahead < code.length) {
            const next = code[lookahead] ?? ''
            if (next === '"') {
              const quoteEnd = code.indexOf('"', lookahead + 1)
              lookahead = quoteEnd < 0 ? code.length : quoteEnd + 1
              continue
            }
            if (/[a-z]/i.test(next)) {
              minutes = next.toLowerCase() === 's'
              break
            }
            lookahead += 1
          }
        }

        output += formatMonth(date, runLength, locale, minutes)
      } else {
        output += formatDatePart(date, token, runLength, locale, use12Hour)
      }

      lastToken = token
      index = end
      continue
    }

    if (code.slice(index).toUpperCase().startsWith('AM/PM')) {
      output += date.getUTCHours() < 12 ? 'AM' : 'PM'
      index += 5
      continue
    }

    if (code.slice(index).toUpperCase().startsWith('A/P')) {
      output += date.getUTCHours() < 12 ? 'A' : 'P'
      index += 3
      continue
    }

    if (character === '.' && lastToken === 's') {
      let end = index + 1
      while (code[end] === '0') end += 1
      const length = end - index - 1
      if (length > 0) {
        const milliseconds = date.getUTCMilliseconds()
        output += `.${pad(milliseconds, 3).slice(0, length)}`
        index = end
        continue
      }
    }

    output += character
    index += 1
  }

  return output
}

function selectSection(code: string, value: number): { section: string; negative: boolean } {
  const sections = splitSections(code)
  if (value < 0) {
    return { section: sections[1] ?? sections[0] ?? 'General', negative: sections.length < 2 }
  }
  if (value === 0 && sections[2] !== undefined) {
    return { section: sections[2], negative: false }
  }
  return { section: sections[0] ?? 'General', negative: false }
}

function normalizePattern(section: string): string {
  return section
    .replace(/\[([^\]]*)\]/g, (_match, content: string) => {
      if (content.startsWith('$')) {
        const symbol = content.slice(1).split('-')[0] ?? ''
        return symbol
      }
      return ''
    })
    .replace(/_(.)/g, ' ')
    .replace(/\*(.)/g, '')
    .replace(/\\(.)/g, '$1')
    .replace(/"([^"]*)"/g, '$1')
}

function formatExcelNumber(value: number, code: string, locale: string): string {
  const { section, negative } = selectSection(code, value)
  if (!section || section.trim().toLowerCase() === 'general') {
    return formatGeneral(value)
  }
  if (section.includes('@') && !section.match(/[#0]/)) return String(value)

  const normalized = normalizePattern(section)
  const match = /^([^0#?]*?)([0#?,]+(?:\.[0#?]+)?)(.*)$/s.exec(normalized)
  if (!match) return normalized.trim() || formatGeneral(value)
  if (normalized.includes('/') && normalized.includes('?')) return formatGeneral(value)

  const prefix = match[1] ?? ''
  const placeholder = match[2] ?? ''
  let suffix = match[3] ?? ''
  const scientific = /E[+-]/i.test(normalized)
  const percentMatches = normalized.match(/%/g)
  const percent = percentMatches?.length ?? 0
  const [integerPart = '', decimalPart = ''] = placeholder.split('.')
  const minInteger = (integerPart.match(/0/g) ?? []).length
  const minFraction = (decimalPart.match(/0/g) ?? []).length
  const maxFraction = (decimalPart.match(/[0#?]/g) ?? []).length
  const useGrouping = integerPart.includes(',')

  let numeric = Math.abs(value) * 100 ** percent
  let formatted: string

  if (scientific) {
    formatted = numeric
      .toExponential(maxFraction)
      .replace(/e([+-])(\d+)/i, (_m, sign: string, digits: string) => {
        return `E${sign}${digits.padStart(2, '0')}`
      })
    suffix = suffix.replace(/E[+-].*$/i, '')
  } else {
    try {
      formatted = new Intl.NumberFormat(locale, {
        useGrouping,
        minimumIntegerDigits: Math.min(21, Math.max(1, minInteger)),
        minimumFractionDigits: Math.min(20, minFraction),
        maximumFractionDigits: Math.min(20, maxFraction),
      }).format(numeric)
    } catch {
      formatted = String(numeric)
    }
  }

  if (percent > 0 && !suffix.includes('%')) suffix += '%'
  const sign = negative ? '' : value < 0 ? '-' : ''
  return `${sign}${prefix}${formatted}${suffix}`
}

function formatGeneral(value: number): string {
  if (!Number.isFinite(value)) return String(value)
  if (Number.isInteger(value)) return String(value)
  if (Math.abs(value) >= 1e11 || (Math.abs(value) > 0 && Math.abs(value) < 1e-9)) {
    return value.toExponential(5).replace(/e([+-])(\d+)/i, (_m, sign: string, digits: string) => {
      return `E${sign}${digits}`
    })
  }
  return String(value)
}

function formatNumericCell(
  value: number,
  styles: Styles,
  styleIndex: number,
  date1904: boolean,
  locale: string,
): { text: string; type: CellData['rawType'] } {
  const xf = styles.cellXfs[styleIndex]
  const numFmtId = xf?.numFmtId ?? 0
  const code = styles.numFmts.get(numFmtId) ?? BUILTIN_FORMATS[numFmtId] ?? 'General'
  const isDate = DATE_FORMAT_IDS.has(numFmtId) || (code !== 'General' && isDateFormat(code))

  if (isDate) {
    const date = excelSerialToDate(value, date1904)
    const { section } = selectSection(code, value)
    return {
      text: formatExcelDate(date, section, locale, value),
      type: 'date',
    }
  }

  return { text: formatExcelNumber(value, code, locale), type: 'number' }
}

function buildStyleCss(styles: Styles, styleIndex: number): string {
  const xf = styles.cellXfs[styleIndex]
  if (!xf) return ''
  const declarations: string[] = []
  const font = styles.fonts[xf.fontId]
  if (font) {
    if (font.bold) declarations.push('font-weight:600')
    if (font.italic) declarations.push('font-style:italic')
    const decoration: string[] = []
    if (font.underline) decoration.push('underline')
    if (font.strike) decoration.push('line-through')
    if (decoration.length) declarations.push(`text-decoration:${decoration.join(' ')}`)
    if (font.color) {
      // Keep the authored color for light themes while allowing the dark
      // theme stylesheet to override it with a readable foreground.
      declarations.push(`--w-cell-color:${font.color}`)
      declarations.push('color:var(--w-cell-color, inherit)')
    }
    if (font.size) declarations.push(`font-size:${Math.round(font.size * (4 / 3) * 100) / 100}px`)
    if (font.name) {
      const family = font.name.replace(/["'\\;{}<>]/g, '').trim()
      if (family) declarations.push(`font-family:"${family}"`)
    }
  }

  const fill = styles.fills[xf.fillId]
  if (fill) declarations.push(`background-color:${fill}`)

  const border = styles.borders[xf.borderId]
  if (border) {
    for (const side of ['left', 'right', 'top', 'bottom'] as const) {
      const definition = border[side]
      if (!definition?.style || definition.style === 'none') continue
      const css = BORDER_STYLES[definition.style] ?? BORDER_STYLES.thin
      declarations.push(`border-${side}:${css} ${definition.color ?? '#cbd5e1'}`)
    }
  }

  if (xf.alignment) {
    const horizontal = normalizeHorizontalAlignment(xf.alignment.horizontal)
    const vertical = normalizeVerticalAlignment(xf.alignment.vertical)
    if (horizontal) declarations.push(`text-align:${horizontal}`)
    if (vertical) declarations.push(`vertical-align:${vertical}`)
    if (xf.alignment.wrapText) declarations.push('white-space:normal;word-break:break-word')
  }

  return declarations.join(';')
}

async function readSheetHyperlinks(
  zip: ZipReaderLike,
  sheetPath: string,
  document: Document,
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  const relationships = await readRelationships(zip, sheetPath)

  for (const hyperlink of descendants(document, 'hyperlink')) {
    const ref = attribute(hyperlink, 'ref')
    const topLeft = ref?.split(':')[0]
    if (!topLeft) continue
    const id = attributeNS(hyperlink, RELATIONSHIP_NS, 'id')
    const relationship = id ? relationships.get(id) : undefined
    const location = attribute(hyperlink, 'location')
    const target = relationship?.external
      ? relationship.target
      : location
        ? `#${location}`
        : undefined
    const safe = target ? sanitizeUrl(target) : null
    if (safe) result.set(topLeft.toUpperCase(), safe)
  }

  return result
}

function parseCellReference(
  element: Element,
  fallbackRow: number,
  fallbackCol: number,
): { row: number; col: number } {
  return parseReference(attribute(element, 'r')) ?? { row: fallbackRow, col: fallbackCol }
}

function splitRichText(element: Element): string {
  return descendants(element, 't')
    .map((text) => text.textContent ?? '')
    .join('')
}

function sheetPathFor(relationshipTarget: string | undefined, index: number): string {
  if (relationshipTarget && !/^https?:/i.test(relationshipTarget)) return relationshipTarget
  return `xl/worksheets/sheet${index + 1}.xml`
}

async function parseSheetHtml(
  zip: ZipReaderLike,
  sheetPath: string,
  sharedStrings: string[],
  styles: Styles,
  options: Required<Pick<XlsxParseOptions, 'maxRows' | 'maxColumns' | 'showGrid' | 'locale'>>,
  date1904: boolean,
): Promise<Omit<XlsxSheet, 'name'>> {
  if (!zip.has(sheetPath)) {
    return { html: '', rowCount: 0, columnCount: 0, truncated: false }
  }

  const document = parseXml(await zip.text(sheetPath))
  const hyperlinks = await readSheetHyperlinks(zip, sheetPath, document)
  const cells = new Map<string, CellData>()
  const merges: MergeRange[] = []
  let maxRow = 0
  let maxCol = 0

  const rows = descendants(document, 'row')
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]!
    const rowNumber = Number.parseInt(attribute(row, 'r') ?? '', 10) || rowIndex + 1
    let fallbackCol = 1

    for (const cell of children(row, 'c')) {
      const { row: cellRow, col } = parseCellReference(cell, rowNumber, fallbackCol)
      fallbackCol = col + 1
      const styleIndex = Number.parseInt(attribute(cell, 's') ?? '0', 10) || 0
      const type = attribute(cell, 't') ?? 'n'
      const formula = textContentOf(firstChild(cell, 'f'))
      const rawValue = textContentOf(firstChild(cell, 'v'))

      let text = ''
      let rawType: CellData['rawType'] = 'text'

      if (type === 's') {
        const index = Number.parseInt(rawValue, 10)
        text = sharedStrings[index] ?? ''
        rawType = 'text'
      } else if (type === 'inlineStr') {
        const inline = firstChild(cell, 'is')
        text = inline ? splitRichText(inline) : rawValue
        rawType = 'text'
      } else if (type === 'str') {
        text = rawValue
        rawType = 'text'
      } else if (type === 'b') {
        text = rawValue === '1' ? 'TRUE' : 'FALSE'
        rawType = 'boolean'
      } else if (type === 'e') {
        text = rawValue
        rawType = 'error'
      } else if (type === 'd') {
        const parsed = new Date(rawValue)
        if (!Number.isNaN(parsed.getTime())) {
          text = new Intl.DateTimeFormat(options.locale, {
            dateStyle: 'medium',
            timeStyle: rawValue.includes('T') ? 'short' : undefined,
            timeZone: 'UTC',
          }).format(parsed)
        } else {
          text = rawValue
        }
        rawType = 'date'
      } else if (rawValue !== '') {
        const numeric = Number.parseFloat(rawValue)
        if (Number.isFinite(numeric)) {
          const formatted = formatNumericCell(numeric, styles, styleIndex, date1904, options.locale)
          text = formatted.text
          rawType = formatted.type
        } else {
          text = rawValue
          rawType = 'text'
        }
      }

      const href = hyperlinks.get(`${numberToColumn(col)}${cellRow}`)

      cells.set(`${cellRow}:${col}`, {
        row: cellRow,
        col,
        text,
        rawType,
        styleIndex,
        formula: formula || undefined,
        href,
      })
      maxRow = Math.max(maxRow, cellRow)
      maxCol = Math.max(maxCol, col)
    }
  }

  const mergeElements = descendants(document, 'mergeCell')
  for (const merge of mergeElements) {
    const range = parseRange(attribute(merge, 'ref'))
    if (!range) continue
    merges.push(range)
    maxRow = Math.max(maxRow, range.bottom)
    maxCol = Math.max(maxCol, range.right)
  }

  const rowLimit = Math.min(maxRow, options.maxRows)
  const colLimit = Math.min(maxCol, options.maxColumns)
  const truncated = maxRow > options.maxRows || maxCol > options.maxColumns

  // Ensure merged master cells exist even when empty.
  const covered = new Set<string>()
  const spans = new Map<string, { rowspan: number; colspan: number }>()
  for (const merge of merges) {
    const masterKey = `${merge.top}:${merge.left}`
    if (!cells.has(masterKey) && merge.top <= rowLimit && merge.left <= colLimit) {
      cells.set(masterKey, {
        row: merge.top,
        col: merge.left,
        text: '',
        rawType: 'text',
        styleIndex: 0,
      })
    }
    if (merge.top > rowLimit || merge.left > colLimit) continue
    spans.set(masterKey, {
      rowspan: Math.min(merge.bottom, rowLimit) - merge.top + 1,
      colspan: Math.min(merge.right, colLimit) - merge.left + 1,
    })
    for (let row = merge.top; row <= Math.min(merge.bottom, rowLimit); row += 1) {
      for (let col = merge.left; col <= Math.min(merge.right, colLimit); col += 1) {
        if (row === merge.top && col === merge.left) continue
        covered.add(`${row}:${col}`)
      }
    }
  }

  const columnWidths = new Map<number, number>()
  const colsRoot = firstDescendant(document, 'cols')
  for (const col of colsRoot ? children(colsRoot, 'col') : []) {
    const min = Number.parseInt(attribute(col, 'min') ?? '0', 10)
    const max = Number.parseInt(attribute(col, 'max') ?? '0', 10)
    const width = Number.parseFloat(attribute(col, 'width') ?? '')
    if (!Number.isFinite(min) || !Number.isFinite(max)) continue
    for (let index = min; index <= Math.min(max, colLimit); index += 1) {
      if (Number.isFinite(width))
        columnWidths.set(index, Math.min(400, Math.max(24, width * 7 + 5)))
    }
  }

  const rowHeights = new Map<number, number>()
  for (const row of rows) {
    const index = Number.parseInt(attribute(row, 'r') ?? '', 10)
    const height = Number.parseFloat(attribute(row, 'ht') ?? '')
    if (Number.isFinite(index) && Number.isFinite(height)) {
      rowHeights.set(index, Math.min(200, Math.max(16, height * (4 / 3))))
    }
  }

  if (rowLimit <= 0 || colLimit <= 0) {
    return { html: '', rowCount: 0, columnCount: 0, truncated }
  }

  let html = `<table class="w-file-viewer__xlsx-table${options.showGrid ? ' has-grid' : ''}"><colgroup>`
  for (let col = 1; col <= colLimit; col += 1) {
    const width = columnWidths.get(col)
    html += `<col${width ? ` style="width:${width}px"` : ''} />`
  }
  html += '</colgroup><tbody>'

  for (let row = 1; row <= rowLimit; row += 1) {
    const height = rowHeights.get(row)
    html += `<tr${height ? ` style="height:${height}px"` : ''}>`
    for (let col = 1; col <= colLimit; col += 1) {
      const key = `${row}:${col}`
      if (covered.has(key)) continue
      const cell = cells.get(key)
      const span = spans.get(key)
      const styleIndex = cell?.styleIndex ?? 0
      const css = buildStyleCss(styles, styleIndex)
      const type = cell?.rawType ?? 'text'
      const classes = ['w-file-viewer__xlsx-cell', `is-${type}`]
      let content = cell ? escapeHtml(cell.text).replace(/\n/g, '<br />') : ''
      if (cell?.href && content) {
        content = `<a href="${escapeAttribute(cell.href)}" target="_blank" rel="noopener noreferrer">${content}</a>`
      }
      const title = cell?.formula ? ` title="=${escapeAttribute(cell.formula)}"` : ''
      html += `<td class="${classes.join(' ')}"${span && span.colspan > 1 ? ` colspan="${span.colspan}"` : ''}${
        span && span.rowspan > 1 ? ` rowspan="${span.rowspan}"` : ''
      }${css ? ` style="${escapeAttribute(css)}"` : ''}${title}>${content || '&nbsp;'}</td>`
    }
    html += '</tr>'
  }

  html += '</tbody></table>'

  return {
    html,
    rowCount: rowLimit,
    columnCount: colLimit,
    truncated,
  }
}

/**
 * Parses an XLSX archive on the main thread. Rows and columns are bounded by
 * `options.maxRows` / `options.maxColumns`; very large sheets can still block
 * rendering. Worker-based parsing is a possible future optimization.
 */
export async function parseXlsx(
  zip: ZipReaderLike,
  options: XlsxParseOptions = {},
): Promise<XlsxParseResult> {
  if (!zip.has('xl/workbook.xml')) {
    throw new Error('The file is missing xl/workbook.xml.')
  }

  const workbook = parseXml(await zip.text('xl/workbook.xml'))
  const relationships = await readRelationships(zip, 'xl/workbook.xml')
  const sharedStrings = await readSharedStrings(zip)
  const styles = await readStyles(zip)
  const resolvedOptions = {
    maxRows: Math.max(1, options.maxRows ?? 5000),
    maxColumns: Math.max(1, options.maxColumns ?? 200),
    showGrid: options.showGrid ?? true,
    locale: options.locale ?? 'en-US',
  }

  const workbookProperties = firstDescendant(workbook, 'workbookPr')
  const date1904 =
    attribute(workbookProperties ?? workbook.documentElement, 'date1904') === '1' ||
    attribute(workbookProperties ?? workbook.documentElement, 'date1904') === 'true'

  const sheetElements = descendants(workbook, 'sheet')
  const sheets: XlsxSheet[] = []
  const visibleSheets = sheetElements.filter((sheet) => attribute(sheet, 'state') !== 'hidden')
  const orderedSheets = visibleSheets.length > 0 ? visibleSheets : sheetElements

  for (let index = 0; index < orderedSheets.length; index += 1) {
    const sheet = orderedSheets[index]!
    const name = attribute(sheet, 'name') ?? `Sheet${index + 1}`
    const relationshipId = attributeNS(sheet, RELATIONSHIP_NS, 'id')
    const target = relationshipId ? relationships.get(relationshipId)?.target : undefined
    const sheetPath = sheetPathFor(target, index)

    try {
      const parsed = await parseSheetHtml(
        zip,
        sheetPath,
        sharedStrings,
        styles,
        resolvedOptions,
        date1904,
      )
      sheets.push({ name, ...parsed })
    } catch (cause) {
      console.warn(`[file-viewer] Failed to parse sheet "${name}".`, cause)
      sheets.push({ name, html: '', rowCount: 0, columnCount: 0, truncated: false })
    }
  }

  return {
    title: await readOfficeTitle(zip),
    sheets,
  }
}
