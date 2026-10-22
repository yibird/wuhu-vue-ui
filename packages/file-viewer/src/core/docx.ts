import { escapeAttribute, escapeHtml, sanitizeUrl } from './format'
import { roman, readOfficeTitle } from './office-utils'
import { readRelationships, type Relationship } from './relationships'
import type { ZipReaderLike } from './zip'
import {
  RELATIONSHIP_NS,
  attribute,
  attributeNS,
  children,
  descendants,
  firstChild,
  firstDescendant,
  hasChild,
  isOn,
  parseXml,
  value,
} from './xml'

export interface DocxParseOptions {
  maxPages?: number
}

export interface DocxParseResult {
  title?: string
  pages: string[]
}

export type DocxMediaResolver = (path: string) => Promise<string | null>

interface RunStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  color?: string
  size?: number
  font?: string
  highlight?: string
  verticalAlign?: 'superscript' | 'subscript'
  smallCaps?: boolean
  caps?: boolean
}

interface ParagraphStyle {
  alignment?: string
  spaceBefore?: number
  spaceAfter?: number
  line?: number
  lineRule?: string
  indentLeft?: number
  indentRight?: number
  firstLine?: number
  hanging?: number
  outlineLevel?: number
  pageBreakBefore?: boolean
  shading?: string
  numbering?: { numId: string; level: number }
  run: RunStyle
  styleId?: string
}

interface RawStyle {
  id: string
  type: string
  name?: string
  basedOn?: string
  run: RunStyle
  paragraph: ParagraphStyle
}

interface ResolvedStyle {
  name?: string
  run: RunStyle
  paragraph: ParagraphStyle
}

interface ParsedStyles {
  styles: Map<string, ResolvedStyle>
  raw: Map<string, RawStyle>
  defaultParagraph?: string
}

interface NumberingLevel {
  format?: string
  text?: string
  start: number
}

interface NumberingDefinition {
  numToAbstract: Map<string, string>
  levels: Map<string, NumberingLevel>
}

interface DocxContext {
  zip: ZipReaderLike
  styles: ParsedStyles
  numbering: NumberingDefinition
  relationships: Map<string, Relationship>
  resolveMedia: DocxMediaResolver
  counters: Map<string, number>
  allowPageBreaks: boolean
}

interface CellInfo {
  element: Element
  col: number
  colspan: number
  rowspan: number
  verticalMerge?: 'restart' | 'continue'
  covered: boolean
}

const HIGHLIGHTS: Record<string, string> = {
  black: '#000000',
  blue: '#0000ff',
  cyan: '#00ffff',
  green: '#00ff00',
  magenta: '#ff00ff',
  red: '#ff0000',
  yellow: '#ffff00',
  white: '#ffffff',
  darkBlue: '#000080',
  darkCyan: '#008080',
  darkGreen: '#008000',
  darkMagenta: '#800080',
  darkRed: '#800000',
  darkYellow: '#808000',
  darkGray: '#808080',
  lightGray: '#c0c0c0',
}

const BULLET_FALLBACK = '•'

function isTruthyElement(element: Element | undefined): boolean | undefined {
  if (!element) return undefined
  return isOn(element)
}

function readRunStyle(rPr: Element | undefined): RunStyle {
  if (!rPr) return {}
  const style: RunStyle = {}

  const bold = isTruthyElement(firstChild(rPr, 'b'))
  if (bold !== undefined) style.bold = bold
  const italic = isTruthyElement(firstChild(rPr, 'i'))
  if (italic !== undefined) style.italic = italic

  const underlineElement = firstChild(rPr, 'u')
  if (underlineElement) style.underline = (value(underlineElement) ?? 'single') !== 'none'

  const strikeElement = firstChild(rPr, 'strike')
  if (strikeElement) style.strike = isOn(strikeElement)
  if (hasChild(rPr, 'dstrike')) style.strike = true

  const color = value(firstChild(rPr, 'color'))
  if (color && /^[0-9a-f]{6}$/i.test(color)) style.color = `#${color}`
  if (color?.toLowerCase() === 'auto') style.color = undefined

  const size = value(firstChild(rPr, 'sz'))
  if (size) {
    const parsed = Number.parseInt(size, 10)
    if (Number.isFinite(parsed)) style.size = parsed
  }

  const fonts = firstChild(rPr, 'rFonts')
  if (fonts) {
    const font =
      attribute(fonts, 'ascii') ??
      attribute(fonts, 'hAnsi') ??
      attribute(fonts, 'eastAsia') ??
      attribute(fonts, 'cs')
    if (font) style.font = font
  }

  const highlight = value(firstChild(rPr, 'highlight'))
  if (highlight) style.highlight = HIGHLIGHTS[highlight] ?? undefined

  const vertical = value(firstChild(rPr, 'vertAlign'))
  if (vertical === 'superscript' || vertical === 'subscript') style.verticalAlign = vertical

  if (hasChild(rPr, 'smallCaps')) style.smallCaps = isOn(firstChild(rPr, 'smallCaps'))
  if (hasChild(rPr, 'caps')) style.caps = isOn(firstChild(rPr, 'caps'))

  return style
}

function readNumber(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function readParagraphStyle(pPr: Element | undefined): ParagraphStyle {
  const style: ParagraphStyle = { run: {} }
  if (!pPr) return style

  style.styleId = value(firstChild(pPr, 'pStyle'))
  style.alignment = value(firstChild(pPr, 'jc'))

  const spacing = firstChild(pPr, 'spacing')
  if (spacing) {
    style.spaceBefore = readNumber(attribute(spacing, 'before'))
    style.spaceAfter = readNumber(attribute(spacing, 'after'))
    style.line = readNumber(attribute(spacing, 'line'))
    style.lineRule = attribute(spacing, 'lineRule')
  }

  const indent = firstChild(pPr, 'ind')
  if (indent) {
    style.indentLeft = readNumber(attribute(indent, 'left') ?? attribute(indent, 'start'))
    style.indentRight = readNumber(attribute(indent, 'right') ?? attribute(indent, 'end'))
    style.firstLine = readNumber(attribute(indent, 'firstLine'))
    style.hanging = readNumber(attribute(indent, 'hanging'))
  }

  const outline = value(firstChild(pPr, 'outlineLvl'))
  if (outline) {
    const parsed = Number.parseInt(outline, 10)
    if (Number.isFinite(parsed)) style.outlineLevel = parsed
  }

  if (hasChild(pPr, 'pageBreakBefore'))
    style.pageBreakBefore = isOn(firstChild(pPr, 'pageBreakBefore'))

  const shading = firstChild(pPr, 'shd')
  const fill = shading ? attribute(shading, 'fill') : undefined
  if (fill && /^[0-9a-f]{6}$/i.test(fill)) style.shading = `#${fill}`

  const numPr = firstChild(pPr, 'numPr')
  if (numPr) {
    const numId = value(firstChild(numPr, 'numId'))
    const level = value(firstChild(numPr, 'ilvl'))
    if (numId && numId !== '0') {
      style.numbering = { numId, level: level ? Number.parseInt(level, 10) || 0 : 0 }
    }
  }

  style.run = readRunStyle(firstChild(pPr, 'rPr'))
  return style
}

function mergeRun(base: RunStyle | undefined, override: RunStyle | undefined): RunStyle {
  if (!base) return { ...override }
  if (!override) return { ...base }
  const result: RunStyle = { ...base }
  for (const [key, entry] of Object.entries(override)) {
    if (entry !== undefined) {
      ;(result as Record<string, unknown>)[key] = entry
    }
  }
  return result
}

function mergeParagraph(
  base: ParagraphStyle | undefined,
  override: ParagraphStyle | undefined,
): ParagraphStyle {
  if (!base) return { ...override, run: { ...override?.run } }
  if (!override) return { ...base, run: { ...base.run } }

  const result: ParagraphStyle = { ...base }
  for (const [key, entry] of Object.entries(override)) {
    if (entry === undefined || key === 'run') continue
    ;(result as unknown as Record<string, unknown>)[key] = entry
  }
  result.run = mergeRun(base.run, override.run)
  return result
}

function readStyleElement(element: Element): RawStyle {
  return {
    id: attribute(element, 'styleId') ?? '',
    type: attribute(element, 'type') ?? 'paragraph',
    name: value(firstChild(element, 'name')),
    basedOn: value(firstChild(element, 'basedOn')),
    run: readRunStyle(firstChild(element, 'rPr')),
    paragraph: readParagraphStyle(firstChild(element, 'pPr')),
  }
}

async function readStyles(zip: ZipReaderLike): Promise<ParsedStyles> {
  const raw = new Map<string, RawStyle>()
  let defaultParagraph: string | undefined

  if (zip.has('word/styles.xml')) {
    try {
      const document = parseXml(await zip.text('word/styles.xml'))
      let index = 0
      for (const element of descendants(document, 'style')) {
        const style = readStyleElement(element)
        if (!style.id) style.id = `style-${index}`
        index += 1
        raw.set(style.id, style)
        if (style.type === 'paragraph' && attribute(element, 'default') === '1') {
          defaultParagraph = style.id
        }
      }
    } catch {
      // A broken styles.xml should not prevent the document body from rendering.
    }
  }

  const resolved = new Map<string, ResolvedStyle>()
  const resolving = new Set<string>()

  const resolve = (id: string): ResolvedStyle => {
    const cached = resolved.get(id)
    if (cached) return cached
    const own = raw.get(id)
    if (!own || resolving.has(id)) return { run: {}, paragraph: { run: {} } }

    resolving.add(id)
    const parent = own.basedOn ? resolve(own.basedOn) : undefined
    resolving.delete(id)

    const style: ResolvedStyle = {
      name: own.name ?? parent?.name,
      run: mergeRun(parent?.run, own.run),
      paragraph: mergeParagraph(parent?.paragraph, own.paragraph),
    }
    resolved.set(id, style)
    return style
  }

  for (const id of raw.keys()) resolve(id)
  return { styles: resolved, raw, defaultParagraph }
}

function letters(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return ''
  let remaining = Math.floor(value)
  let output = ''
  while (remaining > 0) {
    remaining -= 1
    output = String.fromCharCode(65 + (remaining % 26)) + output
    remaining = Math.floor(remaining / 26)
  }
  return output
}

function formatCounter(value: number, format: string | undefined): string {
  switch (format) {
    case 'upperRoman':
      return roman(value)
    case 'lowerRoman':
      return roman(value).toLowerCase()
    case 'upperLetter':
      return letters(value)
    case 'lowerLetter':
      return letters(value).toLowerCase()
    case 'decimalZero':
      return value < 10 ? `0${value}` : String(value)
    case 'ordinal':
      return `${value}${value % 10 === 1 && value % 100 !== 11 ? 'st' : value % 10 === 2 && value % 100 !== 12 ? 'nd' : value % 10 === 3 && value % 100 !== 13 ? 'rd' : 'th'}`
    default:
      return String(value)
  }
}

async function readNumbering(zip: ZipReaderLike): Promise<NumberingDefinition> {
  const numToAbstract = new Map<string, string>()
  const levels = new Map<string, NumberingLevel>()
  if (!zip.has('word/numbering.xml')) return { numToAbstract, levels }

  try {
    const document = parseXml(await zip.text('word/numbering.xml'))
    const abstractLevels = new Map<string, Map<number, NumberingLevel>>()

    for (const abstract of descendants(document, 'abstractNum')) {
      const abstractId = attribute(abstract, 'abstractNumId')
      if (!abstractId) continue
      const map = new Map<number, NumberingLevel>()
      for (const level of children(abstract, 'lvl')) {
        const index = Number.parseInt(attribute(level, 'ilvl') ?? '0', 10) || 0
        const start = Number.parseInt(value(firstChild(level, 'start')) ?? '1', 10) || 1
        map.set(index, {
          format: value(firstChild(level, 'numFmt')),
          text: value(firstChild(level, 'lvlText')),
          start,
        })
      }
      abstractLevels.set(abstractId, map)
    }

    for (const num of descendants(document, 'num')) {
      const numId = attribute(num, 'numId')
      const abstractId = value(firstChild(num, 'abstractNumId'))
      if (!numId || !abstractId) continue
      numToAbstract.set(numId, abstractId)
      const levelMap = abstractLevels.get(abstractId)
      if (!levelMap) continue
      for (const [index, level] of levelMap) {
        levels.set(`${numId}:${index}`, level)
      }
    }
  } catch {
    // Numbering is optional.
  }

  return { numToAbstract, levels }
}

function buildListMarker(
  context: DocxContext,
  numbering: { numId: string; level: number } | undefined,
): string | undefined {
  if (!numbering) return undefined
  const level = context.numbering.levels.get(`${numbering.numId}:${numbering.level}`)
  if (!level) return undefined
  if (level.format === 'none') return undefined

  if (level.format === 'bullet' || level.text === '' || level.text === undefined) {
    const bullet = level.text || BULLET_FALLBACK
    const codePoint = bullet.codePointAt(0) ?? 0
    if (codePoint >= 0xf000 && codePoint <= 0xf0ff) {
      const low = codePoint & 0xff
      return low === 0xa7 ? '▪' : low === 0xfc ? '✓' : low === 0xd8 ? '•' : BULLET_FALLBACK
    }
    return bullet
  }

  const counters: number[] = []
  for (let index = 0; index <= numbering.level; index += 1) {
    const key = `${numbering.numId}:${index}`
    const levelDefinition = context.numbering.levels.get(key)
    const start = levelDefinition?.start ?? 1
    counters[index] = context.counters.get(key) ?? start - 1
  }
  counters[numbering.level] = (counters[numbering.level] ?? 0) + 1
  context.counters.set(`${numbering.numId}:${numbering.level}`, counters[numbering.level] ?? 1)
  for (const [key] of context.counters) {
    const [numId, levelText] = key.split(':')
    if (numId === numbering.numId && Number(levelText) > numbering.level) {
      context.counters.delete(key)
    }
  }

  const template = level.text ?? `%${numbering.level + 1}.`
  return template.replace(/%(\d)/g, (_match, captured: string) => {
    const levelIndex = Number.parseInt(captured, 10) - 1
    const levelDefinition = context.numbering.levels.get(`${numbering.numId}:${levelIndex}`)
    const valueAtLevel = counters[levelIndex] ?? levelDefinition?.start ?? 1
    return formatCounter(valueAtLevel, levelDefinition?.format)
  })
}

function sanitizeFontFamily(font: string): string | undefined {
  const clean = font
    .split(',')[0]
    ?.replace(/["'\\;{}<>]/g, '')
    .trim()
  return clean ? `"${clean}"` : undefined
}

function runStyleToCss(style: RunStyle): string {
  const declarations: string[] = []
  if (style.bold) declarations.push('font-weight:600')
  if (style.italic) declarations.push('font-style:italic')

  const decoration: string[] = []
  if (style.underline) decoration.push('underline')
  if (style.strike) decoration.push('line-through')
  if (decoration.length) declarations.push(`text-decoration:${decoration.join(' ')}`)

  if (style.color) declarations.push(`color:${style.color}`)
  if (style.highlight) declarations.push(`background-color:${style.highlight}`)
  if (style.size) {
    const px = Math.round(((style.size * 2) / 3) * 100) / 100
    declarations.push(`font-size:${px}px`)
  }
  if (style.font) {
    const family = sanitizeFontFamily(style.font)
    if (family) declarations.push(`font-family:${family}`)
  }
  if (style.verticalAlign === 'superscript')
    declarations.push('vertical-align:super;font-size:smaller')
  if (style.verticalAlign === 'subscript') declarations.push('vertical-align:sub;font-size:smaller')
  if (style.smallCaps) declarations.push('font-variant:small-caps')
  if (style.caps) declarations.push('text-transform:uppercase')

  return declarations.join(';')
}

function paragraphStyleToCss(style: ParagraphStyle): string {
  const declarations: string[] = []
  if (style.alignment) {
    const alignment =
      style.alignment === 'both' || style.alignment === 'distribute'
        ? 'justify'
        : style.alignment === 'center'
          ? 'center'
          : style.alignment === 'right' || style.alignment === 'end'
            ? 'right'
            : style.alignment === 'left' || style.alignment === 'start'
              ? 'left'
              : ''
    if (alignment) declarations.push(`text-align:${alignment}`)
  }

  if (style.spaceBefore !== undefined) declarations.push(`margin-top:${style.spaceBefore / 15}px`)
  if (style.spaceAfter !== undefined) declarations.push(`margin-bottom:${style.spaceAfter / 15}px`)
  if (style.line !== undefined) {
    if (style.lineRule === 'auto' || style.lineRule === undefined) {
      declarations.push(`line-height:${Math.max(1, style.line / 240)}`)
    } else {
      declarations.push(`line-height:${style.line / 15}px`)
    }
  }
  if (style.indentLeft !== undefined) declarations.push(`margin-left:${style.indentLeft / 15}px`)
  if (style.indentRight !== undefined) declarations.push(`margin-right:${style.indentRight / 15}px`)
  if (style.firstLine !== undefined) declarations.push(`text-indent:${style.firstLine / 15}px`)
  if (style.hanging !== undefined) declarations.push(`text-indent:-${style.hanging / 15}px`)
  if (style.shading) declarations.push(`background-color:${style.shading}`)

  return declarations.join(';')
}

function headingLevel(style: ResolvedStyle): number | undefined {
  const name = style.name?.trim() ?? ''
  const match = /(?:heading|标题)\s*([1-6])/i.exec(name)
  if (match) return Number.parseInt(match[1] ?? '1', 10)
  if (/^title$/i.test(name)) return 1
  if (style.paragraph.outlineLevel !== undefined && style.paragraph.outlineLevel < 6) {
    return style.paragraph.outlineLevel + 1
  }
  return undefined
}

function resolveRunStyle(
  context: DocxContext,
  run: Element,
  paragraphStyle: ParagraphStyle,
): RunStyle {
  const rPr = firstChild(run, 'rPr')
  const characterStyleId = value(firstChild(rPr ?? run, 'rStyle'))
  const characterStyle = characterStyleId
    ? context.styles.styles.get(characterStyleId)?.run
    : undefined
  return mergeRun(mergeRun(paragraphStyle.run, characterStyle), readRunStyle(rPr))
}

async function resolveMediaUrl(
  context: DocxContext,
  relationshipId: string | undefined,
): Promise<string | null> {
  if (!relationshipId) return null
  const relationship = context.relationships.get(relationshipId)
  if (!relationship) return null
  if (relationship.external) return relationship.target
  return context.resolveMedia(relationship.target)
}

function imageElement(url: string, width: number, height: number, alt: string): string {
  const safeUrl = sanitizeUrl(url, { allowBlob: true, allowDataImage: true })
  if (!safeUrl) return ''
  const safeWidth = Number.isFinite(width) && width > 0 ? Math.min(width, 1600) : 320
  const safeHeight = Number.isFinite(height) && height > 0 ? Math.min(height, 1600) : 240
  return `<span class="w-file-viewer__docx-image"><img src="${escapeAttribute(
    safeUrl,
  )}" alt="${escapeAttribute(alt)}" width="${Math.round(safeWidth)}" height="${Math.round(
    safeHeight,
  )}" /></span>`
}

async function renderDrawing(context: DocxContext, drawing: Element): Promise<string> {
  const blip = firstDescendant(drawing, 'blip')
  if (!blip) return ''
  const embed = attributeNS(blip, RELATIONSHIP_NS, 'embed') ?? attribute(blip, 'embed')
  const url = await resolveMediaUrl(context, embed)
  if (!url) return ''

  const extent = firstDescendant(drawing, 'extent')
  const cx = extent ? Number.parseInt(attribute(extent, 'cx') ?? '0', 10) : 0
  const cy = extent ? Number.parseInt(attribute(extent, 'cy') ?? '0', 10) : 0
  const docPr = firstDescendant(drawing, 'docPr')
  const alt = docPr ? (attribute(docPr, 'descr') ?? attribute(docPr, 'title') ?? '') : ''
  return imageElement(url, cx / 9525, cy / 9525, alt)
}

async function renderPict(context: DocxContext, pict: Element): Promise<string> {
  const imageData = firstDescendant(pict, 'imagedata')
  if (!imageData) return ''
  const id = attributeNS(imageData, RELATIONSHIP_NS, 'id') ?? attribute(imageData, 'id')
  const url = await resolveMediaUrl(context, id)
  if (!url) return ''
  const shape = firstDescendant(pict, 'shape')
  const style = shape ? (attribute(shape, 'style') ?? '') : ''
  const widthMatch = /width:([\d.]+)pt/i.exec(style)
  const heightMatch = /height:([\d.]+)pt/i.exec(style)
  const width = widthMatch ? Number.parseFloat(widthMatch[1] ?? '0') * (96 / 72) : 320
  const height = heightMatch ? Number.parseFloat(heightMatch[1] ?? '0') * (96 / 72) : 240
  return imageElement(url, width, height, attribute(imageData, 'title') ?? '')
}

async function renderRun(
  context: DocxContext,
  run: Element,
  paragraphStyle: ParagraphStyle,
): Promise<{ html: string; pageBreak: boolean }> {
  const style = resolveRunStyle(context, run, paragraphStyle)
  const css = runStyleToCss(style)
  let html = ''
  let pageBreak = false

  for (const child of Array.from(run.children)) {
    switch (child.localName) {
      case 't': {
        html += escapeHtml(child.textContent ?? '')
        break
      }
      case 'tab': {
        html += '<span class="w-file-viewer__docx-tab"></span>'
        break
      }
      case 'br':
      case 'cr': {
        if (attribute(child, 'type') === 'page') {
          pageBreak = true
        } else {
          html += '<br />'
        }
        break
      }
      case 'noBreakHyphen': {
        html += '\u2011'
        break
      }
      case 'softHyphen': {
        html += '\u00ad'
        break
      }
      case 'sym': {
        const code = attribute(child, 'char')
        if (code) {
          const parsed = Number.parseInt(code, 16)
          if (Number.isFinite(parsed) && parsed > 0 && parsed <= 0x10ffff) {
            html += escapeHtml(String.fromCodePoint(parsed))
          }
        }
        break
      }
      case 'drawing': {
        html += await renderDrawing(context, child)
        break
      }
      case 'pict': {
        html += await renderPict(context, child)
        break
      }
      case 'footnoteReference':
      case 'endnoteReference': {
        const id = attribute(child, 'id') ?? ''
        html += `<sup class="w-file-viewer__docx-note">[${escapeHtml(id)}]</sup>`
        break
      }
      case 'lastRenderedPageBreak': {
        // Renderer hint only.
        break
      }
      default:
        break
    }
  }

  if (!html) return { html: '', pageBreak }
  return { html: css ? `<span style="${escapeAttribute(css)}">${html}</span>` : html, pageBreak }
}

interface InlineRenderResult {
  html: string
  pageBreak: boolean
}

async function renderInlineNode(
  context: DocxContext,
  child: Element,
  paragraphStyle: ParagraphStyle,
): Promise<InlineRenderResult> {
  const name = child.localName

  if (name === 'r') {
    return renderRun(context, child, paragraphStyle)
  }

  if (name === 'hyperlink') {
    const linkId = attributeNS(child, RELATIONSHIP_NS, 'id') ?? attribute(child, 'id')
    const anchor = attribute(child, 'anchor')
    const relationship = linkId ? context.relationships.get(linkId) : undefined
    const href = relationship?.external ? relationship.target : anchor ? `#${anchor}` : undefined
    const inner = await renderInlineChildren(context, child, paragraphStyle)

    if (href && /^(https?:|mailto:|tel:|#)/i.test(href)) {
      return {
        html: `<a class="w-file-viewer__docx-link" href="${escapeAttribute(href)}"${
          relationship?.external ? ' target="_blank" rel="noopener noreferrer"' : ''
        }>${inner.html}</a>`,
        pageBreak: inner.pageBreak,
      }
    }
    return inner
  }

  if (
    name === 'ins' ||
    name === 'smartTag' ||
    name === 'customXml' ||
    name === 'moveTo' ||
    name === 'fldSimple'
  ) {
    return renderInlineChildren(context, child, paragraphStyle)
  }

  if (name === 'sdt') {
    const content = firstChild(child, 'sdtContent')
    return content
      ? renderInlineChildren(context, content, paragraphStyle)
      : { html: '', pageBreak: false }
  }

  if (name === 'del' || name === 'moveFrom' || name === 'instrText' || name === 'fldChar') {
    return { html: '', pageBreak: false }
  }

  if (child.children.length > 0) {
    return renderInlineChildren(context, child, paragraphStyle)
  }

  return { html: '', pageBreak: false }
}

async function renderInlineChildren(
  context: DocxContext,
  parent: Element,
  paragraphStyle: ParagraphStyle,
): Promise<InlineRenderResult> {
  let html = ''
  let pageBreak = false

  for (const child of Array.from(parent.children)) {
    const result = await renderInlineNode(context, child, paragraphStyle)
    html += result.html
    if (result.pageBreak) pageBreak = true
  }

  return { html, pageBreak }
}

async function renderParagraph(
  context: DocxContext,
  paragraph: Element,
): Promise<{ segments: string[]; pageBreakBefore: boolean }> {
  const direct = readParagraphStyle(firstChild(paragraph, 'pPr'))
  const styleId = direct.styleId ?? context.styles.defaultParagraph
  const baseStyle = styleId ? context.styles.styles.get(styleId) : undefined
  const style = mergeParagraph(baseStyle?.paragraph, direct)
  const level = headingLevel({
    name: baseStyle?.name,
    run: baseStyle?.run ?? {},
    paragraph: style,
  })

  const parts: string[] = []

  for (const child of Array.from(paragraph.children)) {
    const name = child.localName
    if (name === 'pPr' || name === 'bookmarkStart' || name === 'bookmarkEnd') continue

    const result = await renderInlineNode(context, child, style)
    parts.push(result.html)
    if (result.pageBreak && context.allowPageBreaks) {
      parts.push('\u0000PAGE\u0000')
    }
  }

  let combined = parts.join('')
  const marker = context.allowPageBreaks ? buildListMarker(context, style.numbering) : undefined
  if (marker) {
    combined = `<span class="w-file-viewer__docx-marker">${escapeHtml(marker)}</span>${combined}`
  }

  const css = paragraphStyleToCss(style)
  const classes = ['w-file-viewer__docx-paragraph']
  if (level) classes.push('w-file-viewer__docx-heading', `w-file-viewer__docx-heading--${level}`)

  const wrap = (content: string) =>
    `<p class="${classes.join(' ')}"${css ? ` style="${escapeAttribute(css)}"` : ''}${
      level ? ` data-docx-heading="${level}"` : ''
    }>${content || '&#8203;'}</p>`

  const segments = combined.split('\u0000PAGE\u0000').map((segment) => wrap(segment))
  return { segments, pageBreakBefore: Boolean(style.pageBreakBefore) }
}

function tableWidth(table: Element): string {
  const widthElement = firstChild(table, 'tblPr')
    ? firstChild(firstChild(table, 'tblPr')!, 'tblW')
    : undefined
  if (!widthElement) return '100%'
  const type = attribute(widthElement, 'type')
  const raw = attribute(widthElement, 'w')
  if (!raw) return '100%'
  if (type === 'pct') {
    const percent = Number.parseFloat(raw) / 50
    return `${Math.min(100, Math.max(1, percent))}%`
  }
  if (type === 'dxa') return `${Number.parseFloat(raw) / 15}px`
  return '100%'
}

function cellStyle(cell: Element): string {
  const properties = firstChild(cell, 'tcPr')
  if (!properties) return ''
  const declarations: string[] = []

  const widthElement = firstChild(properties, 'tcW')
  if (widthElement) {
    const type = attribute(widthElement, 'type')
    const raw = attribute(widthElement, 'w')
    if (raw) {
      if (type === 'pct') {
        const percent = Number.parseFloat(raw) / 50
        if (percent > 0) declarations.push(`width:${Math.min(100, percent)}%`)
      } else if (type === 'dxa') {
        declarations.push(`width:${Number.parseFloat(raw) / 15}px`)
      }
    }
  }

  const shading = firstChild(properties, 'shd')
  const fill = shading ? attribute(shading, 'fill') : undefined
  if (fill && /^[0-9a-f]{6}$/i.test(fill) && fill.toLowerCase() !== 'auto') {
    declarations.push(`background-color:#${fill}`)
  }

  const vertical = value(firstChild(properties, 'vAlign'))
  if (vertical) {
    declarations.push(
      `vertical-align:${vertical === 'center' ? 'middle' : vertical === 'bottom' ? 'bottom' : 'top'}`,
    )
  }

  return declarations.join(';')
}

function collectTableRows(table: Element): CellInfo[][] {
  const rowElements = children(table, 'tr')
  const rows: CellInfo[][] = []

  for (const rowElement of rowElements) {
    const cells: CellInfo[] = []
    let col = 0
    for (const cellElement of children(rowElement, 'tc')) {
      const tcPr = firstChild(cellElement, 'tcPr')
      const spanValue = tcPr ? value(firstChild(tcPr, 'gridSpan')) : undefined
      const colspan = Math.max(1, Number.parseInt(spanValue ?? '1', 10) || 1)
      const mergeElement = tcPr ? firstChild(tcPr, 'vMerge') : undefined
      let verticalMerge: CellInfo['verticalMerge']
      if (mergeElement) {
        verticalMerge = (value(mergeElement) ?? 'continue') === 'restart' ? 'restart' : 'continue'
      }
      cells.push({
        element: cellElement,
        col,
        colspan,
        rowspan: 1,
        verticalMerge,
        covered: false,
      })
      col += colspan
    }
    rows.push(cells)
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    for (const cell of rows[rowIndex] ?? []) {
      if (cell.verticalMerge !== 'restart') continue
      let span = 1
      for (let next = rowIndex + 1; next < rows.length; next += 1) {
        const candidate = (rows[next] ?? []).find(
          (entry) => entry.col === cell.col && entry.colspan === cell.colspan,
        )
        if (!candidate || candidate.verticalMerge !== 'continue') break
        candidate.covered = true
        span += 1
      }
      cell.rowspan = span
    }
  }

  return rows
}

async function renderTable(context: DocxContext, table: Element): Promise<string> {
  const rows = collectTableRows(table)
  let html = `<table class="w-file-viewer__docx-table" style="width:${tableWidth(table)}"><tbody>`

  for (const row of rows) {
    html += '<tr>'
    for (const cell of row) {
      if (cell.covered) continue
      const inner: string[] = []
      for (const child of Array.from(cell.element.children)) {
        if (child.localName === 'p') {
          const rendered = await renderParagraph({ ...context, allowPageBreaks: false }, child)
          inner.push(...rendered.segments)
        } else if (child.localName === 'tbl') {
          inner.push(await renderTable({ ...context, allowPageBreaks: false }, child))
        }
      }
      const style = cellStyle(cell.element)
      html += `<td${cell.colspan > 1 ? ` colspan="${cell.colspan}"` : ''}${
        cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : ''
      }${style ? ` style="${escapeAttribute(style)}"` : ''}>${inner.join('') || '&#8203;'}</td>`
    }
    html += '</tr>'
  }

  html += '</tbody></table>'
  return html
}

async function renderBodyChildren(
  context: DocxContext,
  parent: Element,
  pages: string[],
): Promise<void> {
  let current: string[] = []

  const flush = () => {
    const content = current.join('')
    if (content.trim()) pages.push(content)
    current = []
  }

  for (const child of Array.from(parent.children)) {
    if (child.localName === 'p') {
      const rendered = await renderParagraph(context, child)
      if (rendered.pageBreakBefore) flush()

      rendered.segments.forEach((segment, index) => {
        if (index > 0) flush()
        current.push(segment)
      })
      continue
    }

    if (child.localName === 'tbl') {
      current.push(await renderTable(context, child))
      continue
    }

    if (child.localName === 'sdt') {
      const content = firstChild(child, 'sdtContent')
      if (content) await renderBodyChildren(context, content, pages)
      continue
    }

    if (
      child.localName === 'sectPr' ||
      child.localName === 'bookmarkStart' ||
      child.localName === 'bookmarkEnd'
    ) {
      continue
    }

    if (child.children.length > 0) {
      await renderBodyChildren(context, child, pages)
    }
  }

  flush()
}

export async function parseDocx(
  zip: ZipReaderLike,
  options: DocxParseOptions,
  resolveMedia: DocxMediaResolver,
): Promise<DocxParseResult> {
  if (!zip.has('word/document.xml')) {
    throw new Error('The file is missing word/document.xml.')
  }

  const document = parseXml(await zip.text('word/document.xml'))
  const body = firstDescendant(document, 'body')
  if (!body) throw new Error('The Word document has no body.')

  const styles = await readStyles(zip)
  const numbering = await readNumbering(zip)
  const relationships = await readRelationships(zip, 'word/document.xml')

  const context: DocxContext = {
    zip,
    styles,
    numbering,
    relationships,
    resolveMedia,
    counters: new Map(),
    allowPageBreaks: true,
  }

  const pages: string[] = []
  await renderBodyChildren(context, body, pages)

  const maxPages = Math.max(1, options.maxPages ?? 300)
  if (pages.length > maxPages) {
    const overflow = pages.splice(maxPages)
    pages[maxPages - 1] = `${pages[maxPages - 1] ?? ''}${overflow.join('')}`
  }

  return {
    title: await readOfficeTitle(zip),
    pages,
  }
}
