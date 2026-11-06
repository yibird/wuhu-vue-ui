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
  parseXml,
  type XmlParent,
} from './xml'

export interface PptxSlide {
  html: string
  title?: string
}

export interface PptxParseResult {
  title?: string
  width: number
  height: number
  slides: PptxSlide[]
}

export interface PptxParseOptions {
  maxSlides?: number
  locale?: string
}

export type PptxMediaResolver = (path: string) => Promise<string | null>

interface Box {
  x: number
  y: number
  w: number
  h: number
}

interface Xfrm extends Box {
  chX?: number
  chY?: number
  chW?: number
  chH?: number
  rotation: number
  flipH: boolean
  flipV: boolean
}

interface ThemeColors {
  colors: Map<string, string>
}

interface PlaceholderLayout {
  byKey: Map<string, Box>
  byType: Map<string, Box>
}

interface LayoutInfo {
  placeholders: PlaceholderLayout
  background?: string
}

interface TextOptions {
  theme: ThemeColors
  defaultColor: string
  defaultSizePt: number
  defaultAlignment: 'left' | 'center' | 'right'
  defaultBullets: boolean
  isTitle: boolean
}

interface TextStyle {
  sizePt?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  color?: string
  font?: string
  baseline?: number
}

const EMU_PER_PX = 9525
const DEFAULT_WIDTH = 12192000
const DEFAULT_HEIGHT = 6858000

function emuToPx(value: number): number {
  return Math.round((value / EMU_PER_PX) * 100) / 100
}

function numberAttribute(element: Element | undefined, name: string, fallback = 0): number {
  if (!element) return fallback
  const raw = attribute(element, name)
  const value = raw ? Number.parseFloat(raw) : Number.NaN
  return Number.isFinite(value) ? value : fallback
}

function normalizeHex(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const match = /^[0-9a-f]{6}$/i.exec(raw.trim())
  return match ? `#${match[0]}` : undefined
}

function readTheme(zip: ZipReaderLike): Promise<ThemeColors> {
  return (async () => {
    const colors = new Map<string, string>()
    const candidates = ['ppt/theme/theme1.xml', 'ppt/theme/theme2.xml']
    for (const path of candidates) {
      if (!zip.has(path)) continue
      try {
        const document = parseXml(await zip.text(path))
        const scheme = firstDescendant(document, 'clrScheme')
        if (!scheme) continue
        for (const entry of Array.from(scheme.children)) {
          const colorElement = entry.children[0]
          const color =
            colorElement?.localName === 'srgbClr'
              ? normalizeHex(attribute(colorElement, 'val'))
              : colorElement?.localName === 'sysClr'
                ? normalizeHex(attribute(colorElement, 'lastClr'))
                : undefined
          if (color) colors.set(entry.localName, color)
        }
        break
      } catch {
        // Try the next theme file.
      }
    }

    const aliases: Record<string, string> = {
      tx1: 'dk1',
      bg1: 'lt1',
      tx2: 'dk2',
      bg2: 'lt2',
    }
    for (const [alias, target] of Object.entries(aliases)) {
      const color = colors.get(target)
      if (color) colors.set(alias, color)
    }
    return { colors }
  })()
}

function colorElementValue(element: Element | undefined, theme: ThemeColors): string | undefined {
  if (!element) return undefined
  const tag = element.localName
  if (tag === 'srgbClr') return normalizeHex(attribute(element, 'val'))
  if (tag === 'schemeClr') {
    const name = attribute(element, 'val') ?? ''
    return theme.colors.get(name)
  }
  if (tag === 'sysClr') return normalizeHex(attribute(element, 'lastClr'))
  if (tag === 'prstClr') {
    const presets: Record<string, string> = {
      black: '#000000',
      white: '#ffffff',
      red: '#ff0000',
      green: '#00ff00',
      blue: '#0000ff',
      yellow: '#ffff00',
      cyan: '#00ffff',
      magenta: '#ff00ff',
      gray: '#808080',
      darkGray: '#a9a9a9',
      lightGray: '#d3d3d3',
    }
    return presets[attribute(element, 'val') ?? '']
  }
  return undefined
}

function fillColor(container: Element | undefined, theme: ThemeColors): string | undefined {
  if (!container) return undefined
  if (firstChild(container, 'noFill')) return 'transparent'

  const solid = container.localName === 'solidFill' ? container : firstChild(container, 'solidFill')
  if (solid) {
    const colorElement = Array.from(solid.children)[0]
    return colorElementValue(colorElement, theme)
  }

  const gradient = firstChild(container, 'gradFill')
  if (gradient) {
    const stop = firstDescendant(gradient, 'gs')
    const colorElement = stop?.children[0]
    return colorElementValue(colorElement, theme)
  }

  return undefined
}

function readXfrm(element: Element): Xfrm | undefined {
  const xfrm = firstDescendant(element, 'xfrm')
  if (!xfrm) return undefined
  const off = firstChild(xfrm, 'off')
  const ext = firstChild(xfrm, 'ext')
  if (!off || !ext) return undefined

  const chOff = firstChild(xfrm, 'chOff')
  const chExt = firstChild(xfrm, 'chExt')
  return {
    x: numberAttribute(off, 'x'),
    y: numberAttribute(off, 'y'),
    w: numberAttribute(ext, 'cx'),
    h: numberAttribute(ext, 'cy'),
    chX: chOff ? numberAttribute(chOff, 'x') : undefined,
    chY: chOff ? numberAttribute(chOff, 'y') : undefined,
    chW: chExt ? numberAttribute(chExt, 'cx') : undefined,
    chH: chExt ? numberAttribute(chExt, 'cy') : undefined,
    rotation: numberAttribute(xfrm, 'rot') / 60000,
    flipH: attribute(xfrm, 'flipH') === '1',
    flipV: attribute(xfrm, 'flipV') === '1',
  }
}

type Transform = (box: Box) => Box

const identityTransform: Transform = (box) => box

function groupTransform(parent: Transform, group: Xfrm): Transform {
  if (!group.chW || !group.chH) return parent
  const scaleX = group.w / group.chW
  const scaleY = group.h / group.chH
  const offsetX = group.x - (group.chX ?? 0) * scaleX
  const offsetY = group.y - (group.chY ?? 0) * scaleY
  return (box) =>
    parent({
      x: offsetX + box.x * scaleX,
      y: offsetY + box.y * scaleY,
      w: box.w * scaleX,
      h: box.h * scaleY,
    })
}

function boxStyle(box: Box, rotation = 0, flipH = false, flipV = false): string {
  const transform = [
    rotation ? `rotate(${rotation}deg)` : '',
    flipH ? 'scaleX(-1)' : '',
    flipV ? 'scaleY(-1)' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return `position:absolute;left:${emuToPx(box.x)}px;top:${emuToPx(box.y)}px;width:${emuToPx(
    box.w,
  )}px;height:${emuToPx(box.h)}px;${transform ? `transform:${transform};` : ''}`
}

function readPlaceholders(root: XmlParent): Map<string, Box> {
  const result = new Map<string, Box>()
  for (const shape of descendants(root, 'sp')) {
    const placeholder = firstDescendant(shape, 'ph')
    if (!placeholder) continue
    const xfrm = readXfrm(shape)
    if (!xfrm) continue
    const type = attribute(placeholder, 'type') ?? 'body'
    const index = attribute(placeholder, 'idx') ?? '0'
    result.set(`${type}:${index}`, { x: xfrm.x, y: xfrm.y, w: xfrm.w, h: xfrm.h })
  }
  return result
}

function mergePlaceholders(master: Map<string, Box>, layout: Map<string, Box>): PlaceholderLayout {
  const byKey = new Map<string, Box>()
  const byType = new Map<string, Box>()

  for (const [key, box] of master) {
    byKey.set(key, box)
    const type = key.split(':')[0] ?? ''
    if (!byType.has(type)) byType.set(type, box)
  }
  for (const [key, box] of layout) {
    byKey.set(key, box)
    byType.set(key.split(':')[0] ?? '', box)
  }

  return { byKey, byType }
}

function slideBackground(root: XmlParent, theme: ThemeColors): string | undefined {
  const background = firstDescendant(root, 'bg')
  if (!background) return undefined
  const properties = firstChild(background, 'bgPr')
  if (!properties) return undefined
  return fillColor(properties, theme)
}

function defaultPlaceholderBox(type: string, width: number, height: number): Box {
  if (type === 'title' || type === 'ctrTitle') {
    return { x: width * 0.08, y: height * 0.06, w: width * 0.84, h: height * 0.18 }
  }
  if (type === 'subTitle') {
    return { x: width * 0.16, y: height * 0.3, w: width * 0.68, h: height * 0.18 }
  }
  return { x: width * 0.08, y: height * 0.24, w: width * 0.84, h: height * 0.64 }
}

function resolvePlaceholder(
  shape: Element,
  layout: PlaceholderLayout,
  slideWidth: number,
  slideHeight: number,
): { box: Box; type: string } {
  const placeholder = firstDescendant(shape, 'ph')
  const type = attribute(placeholder ?? shape, 'type') ?? 'body'
  const index = attribute(placeholder ?? shape, 'idx') ?? '0'
  const box =
    layout.byKey.get(`${type}:${index}`) ??
    layout.byType.get(type) ??
    defaultPlaceholderBox(type, slideWidth, slideHeight)
  return { box, type }
}

function readTextStyle(element: Element | undefined, theme: ThemeColors): TextStyle {
  if (!element) return {}
  const style: TextStyle = {}
  const size = attribute(element, 'sz')
  if (size) {
    const parsed = Number.parseFloat(size) / 100
    if (Number.isFinite(parsed)) style.sizePt = parsed
  }
  const bold = attribute(element, 'b')
  if (bold !== undefined) style.bold = bold === '1' || bold === 'true'
  const italic = attribute(element, 'i')
  if (italic !== undefined) style.italic = italic === '1' || italic === 'true'
  const underline = attribute(element, 'u')
  if (underline && underline !== 'none') style.underline = true
  const strike = attribute(element, 'strike')
  if (strike && strike !== 'noStrike') style.strike = true
  const baseline = attribute(element, 'baseline')
  if (baseline) {
    const parsed = Number.parseFloat(baseline)
    if (Number.isFinite(parsed)) style.baseline = parsed
  }
  const color = fillColor(element, theme)
  if (color && color !== 'transparent') style.color = color
  const latin = firstDescendant(element, 'latin') ?? firstDescendant(element, 'ea')
  const font = latin ? attribute(latin, 'typeface') : undefined
  if (font && !font.startsWith('+')) style.font = font
  return style
}

function mergeTextStyle(base: TextStyle, override: TextStyle): TextStyle {
  const result: TextStyle = { ...base }
  for (const [key, entry] of Object.entries(override)) {
    if (entry !== undefined) {
      ;(result as Record<string, unknown>)[key] = entry
    }
  }
  return result
}

function textStyleCss(style: TextStyle): string {
  const declarations: string[] = []
  if (style.bold) declarations.push('font-weight:600')
  if (style.italic) declarations.push('font-style:italic')
  const decoration: string[] = []
  if (style.underline) decoration.push('underline')
  if (style.strike) decoration.push('line-through')
  if (decoration.length) declarations.push(`text-decoration:${decoration.join(' ')}`)
  if (style.color) declarations.push(`color:${style.color}`)
  if (style.sizePt)
    declarations.push(`font-size:${Math.round(style.sizePt * (4 / 3) * 100) / 100}px`)
  if (style.font) {
    const family = style.font.replace(/["'\\;{}<>]/g, '').trim()
    if (family) declarations.push(`font-family:"${family}"`)
  }
  if (style.baseline !== undefined) {
    if (style.baseline > 0) declarations.push('vertical-align:super;font-size:smaller')
    else if (style.baseline < 0) declarations.push('vertical-align:sub;font-size:smaller')
  }
  return declarations.join(';')
}

const AUTO_NUMBER_TYPES: Record<string, (value: number) => string> = {
  arabicPeriod: (value) => `${value}.`,
  arabicParenR: (value) => `${value})`,
  arabicPlain: (value) => String(value),
  alphaLcPeriod: (value) => `${alpha(value, false)}.`,
  alphaUcPeriod: (value) => `${alpha(value, true)}.`,
  alphaLcParenR: (value) => `${alpha(value, false)})`,
  alphaUcParenR: (value) => `${alpha(value, true)})`,
  romanLcPeriod: (value) => `${roman(value).toLowerCase()}.`,
  romanUcPeriod: (value) => `${roman(value)}.`,
}

function alpha(value: number, upper: boolean): string {
  if (!Number.isFinite(value) || value <= 0) return ''
  let remaining = Math.floor(value)
  let output = ''
  while (remaining > 0) {
    remaining -= 1
    output = String.fromCharCode(65 + (remaining % 26)) + output
    remaining = Math.floor(remaining / 26)
  }
  return upper ? output : output.toLowerCase()
}

function paragraphBullet(
  properties: Element,
  level: number,
  counters: Map<number, number>,
  defaultsEnabled: boolean,
): string | undefined {
  const none = firstChild(properties, 'buNone')
  if (none) return undefined

  const character = firstChild(properties, 'buChar')
  if (character) return attribute(character, 'char') ?? '•'

  const auto = firstChild(properties, 'buAutoNum')
  if (auto) {
    const type = attribute(auto, 'type') ?? 'arabicPeriod'
    const start = numberAttribute(auto, 'startAt', 1)
    const counter = (counters.get(level) ?? start - 1) + 1
    counters.set(level, counter)
    for (const [key] of counters) {
      if (key > level) counters.delete(key)
    }
    return (AUTO_NUMBER_TYPES[type] ?? AUTO_NUMBER_TYPES.arabicPeriod)!(counter)
  }

  if (defaultsEnabled) {
    const counter = (counters.get(level) ?? 0) + 1
    counters.set(level, counter)
    return level === 0 ? '•' : '–'
  }

  return undefined
}

function renderTextParagraphs(txBody: Element, options: TextOptions): string {
  const paragraphs = children(txBody, 'p')
  const counters = new Map<number, number>()
  let html = ''

  for (const paragraph of paragraphs) {
    const properties = firstChild(paragraph, 'pPr')
    const level = properties ? Number.parseInt(attribute(properties, 'lvl') ?? '0', 10) || 0 : 0
    const defStyle = mergeTextStyle(
      {
        sizePt: options.defaultSizePt,
        color: options.defaultColor,
      },
      readTextStyle(properties ? firstChild(properties, 'defRPr') : undefined, options.theme),
    )

    const alignment = properties ? attribute(properties, 'algn') : undefined
    const textAlign =
      alignment === 'ctr'
        ? 'center'
        : alignment === 'r'
          ? 'right'
          : alignment === 'just' || alignment === 'dist'
            ? 'justify'
            : alignment === 'l'
              ? 'left'
              : options.defaultAlignment

    let bullet: string | undefined
    if (properties) {
      bullet = paragraphBullet(properties, level, counters, options.defaultBullets)
    } else if (options.defaultBullets && !options.isTitle) {
      const counter = (counters.get(level) ?? 0) + 1
      counters.set(level, counter)
      bullet = level === 0 ? '•' : '–'
    }

    const marginLeft = properties
      ? numberAttribute(properties, 'marL', level * 342900)
      : level * 342900
    const indent = properties ? numberAttribute(properties, 'indent', 0) : 0
    const paragraphStyle = [
      `text-align:${textAlign}`,
      `margin:0 0 6px ${emuToPx(marginLeft)}px`,
      bullet ? `padding-left:${Math.max(10, emuToPx(Math.abs(indent)) || 16)}px` : '',
      bullet ? `text-indent:-${Math.max(10, emuToPx(Math.abs(indent)) || 16)}px` : '',
      options.isTitle ? 'line-height:1.15' : 'line-height:1.3',
    ]
      .filter(Boolean)
      .join(';')

    let runs = ''
    for (const child of Array.from(paragraph.children)) {
      if (child.localName === 'r' || child.localName === 'fld') {
        const runProperties = firstChild(child, 'rPr')
        const style = mergeTextStyle(defStyle, readTextStyle(runProperties, options.theme))
        const text = descendants(child, 't')
          .map((element) => element.textContent ?? '')
          .join('')
        if (!text) continue
        const css = textStyleCss(style)
        runs += css
          ? `<span style="${escapeAttribute(css)}">${escapeHtml(text)}</span>`
          : escapeHtml(text)
      } else if (child.localName === 'br') {
        runs += '<br />'
      }
    }

    const marker = bullet
      ? `<span class="w-file-viewer__pptx-bullet" style="display:inline-block;width:${Math.max(
          10,
          emuToPx(Math.abs(indent)) || 16,
        )}px;text-indent:0;color:${escapeAttribute(
          defStyle.color ?? options.defaultColor,
        )};">${escapeHtml(bullet)}</span>`
      : ''

    html += `<p style="${escapeAttribute(paragraphStyle)}">${marker}${runs || '&#8203;'}</p>`
  }

  return html
}

function renderTextBody(
  txBody: Element,
  theme: ThemeColors,
  defaultColor: string,
  defaultSizePt: number,
  isTitle: boolean,
  defaultBullets: boolean,
): string {
  const bodyProperties = firstChild(txBody, 'bodyPr')
  const anchor =
    (bodyProperties ? attribute(bodyProperties, 'anchor') : undefined) ?? (isTitle ? 'ctr' : 't')
  const justifyContent = anchor === 'ctr' ? 'center' : anchor === 'b' ? 'flex-end' : 'flex-start'
  const left = emuToPx(numberAttribute(bodyProperties, 'lIns', 91440))
  const right = emuToPx(numberAttribute(bodyProperties, 'rIns', 91440))
  const top = emuToPx(numberAttribute(bodyProperties, 'tIns', 45720))
  const bottom = emuToPx(numberAttribute(bodyProperties, 'bIns', 45720))

  const content = renderTextParagraphs(txBody, {
    theme,
    defaultColor,
    defaultSizePt,
    defaultAlignment: isTitle ? 'center' : 'left',
    defaultBullets,
    isTitle,
  })

  return `<div class="w-file-viewer__pptx-text" style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:${justifyContent};padding:${top}px ${right}px ${bottom}px ${left}px;box-sizing:border-box;overflow:hidden;">${content}</div>`
}

function isDarkColor(color: string | undefined): boolean {
  if (!color || color === 'transparent') return false
  const match = /^#([0-9a-f]{6})$/i.exec(color)
  if (!match) return false
  const value = Number.parseInt(match[1] ?? 'ffffff', 16)
  const red = (value >> 16) & 0xff
  const green = (value >> 8) & 0xff
  const blue = value & 0xff
  return (red * 299 + green * 587 + blue * 114) / 1000 < 128
}

function placeholderText(txBody: Element | undefined): string {
  if (!txBody) return ''
  return descendants(txBody, 't')
    .map((element) => element.textContent ?? '')
    .join(' ')
    .trim()
}

function renderTable(
  table: Element,
  xfrm: Xfrm,
  transform: Transform,
  theme: ThemeColors,
  defaultColor: string,
): string {
  const box = transform(xfrm)
  const grid = firstDescendant(table, 'tblGrid')
  const columns = grid ? children(grid, 'gridCol') : []
  const rows = children(table, 'tr')
  const totalWidth = columns.reduce((total, column) => total + numberAttribute(column, 'w'), 0) || 1

  let html = `<table class="w-file-viewer__pptx-table" style="${escapeAttribute(
    `${boxStyle(box, xfrm.rotation, xfrm.flipH, xfrm.flipV)}table-layout:fixed;border-collapse:collapse;background:#ffffff;`,
  )}">`

  if (columns.length > 0) {
    html += '<colgroup>'
    for (const column of columns) {
      html += `<col style="width:${(numberAttribute(column, 'w') / totalWidth) * 100}%" />`
    }
    html += '</colgroup>'
  }

  html += '<tbody>'
  for (const row of rows) {
    html += '<tr>'
    for (const cell of children(row, 'tc')) {
      const cellProperties = firstChild(cell, 'tcPr')
      const fill = fillColor(cellProperties, theme)
      const cellColor =
        fill && fill !== 'transparent' && isDarkColor(fill) ? '#ffffff' : defaultColor
      const textBody = firstChild(cell, 'txBody')
      const content = textBody
        ? renderTextParagraphs(textBody, {
            theme,
            defaultColor: cellColor,
            defaultSizePt: 14,
            defaultAlignment: 'left',
            defaultBullets: false,
            isTitle: false,
          })
        : ''
      const anchor = cellProperties ? attribute(cellProperties, 'anchor') : undefined
      const verticalAlign = anchor === 'ctr' ? 'middle' : anchor === 'b' ? 'bottom' : 'top'
      html += `<td style="border:1px solid #d1d5db;padding:4px 6px;vertical-align:${verticalAlign};${
        fill && fill !== 'transparent' ? `background:${fill};` : ''
      }">${content || '&#8203;'}</td>`
    }
    html += '</tr>'
  }

  html += '</tbody></table>'
  return html
}

async function resolveImage(
  blip: Element | undefined,
  relationships: Map<string, Relationship>,
  resolveMedia: PptxMediaResolver,
): Promise<string | null> {
  if (!blip) return null
  const id = attributeNS(blip, RELATIONSHIP_NS, 'embed') ?? attribute(blip, 'embed')
  if (!id) return null
  const relationship = relationships.get(id)
  if (!relationship) return null
  if (relationship.external) return relationship.target
  return resolveMedia(relationship.target)
}

async function renderShape(
  shape: Element,
  transform: Transform,
  layout: PlaceholderLayout,
  theme: ThemeColors,
  relationships: Map<string, Relationship>,
  resolveMedia: PptxMediaResolver,
  slideWidth: number,
  slideHeight: number,
  defaultColor: string,
): Promise<string> {
  const tag = shape.localName
  if (tag === 'grpSp') {
    const xfrm = readXfrm(shape)
    const childTransform = xfrm ? groupTransform(transform, xfrm) : transform
    let html = ''
    for (const child of Array.from(shape.children)) {
      html += await renderShape(
        child,
        childTransform,
        layout,
        theme,
        relationships,
        resolveMedia,
        slideWidth,
        slideHeight,
        defaultColor,
      )
    }
    return html
  }

  if (tag === 'AlternateContent') {
    const choice = firstChild(shape, 'Choice')
    const fallback = firstChild(shape, 'Fallback')
    let html = ''
    for (const child of Array.from((choice ?? fallback)?.children ?? [])) {
      html += await renderShape(
        child,
        transform,
        layout,
        theme,
        relationships,
        resolveMedia,
        slideWidth,
        slideHeight,
        defaultColor,
      )
    }
    return html
  }

  if (tag === 'graphicFrame') {
    const xfrm = readXfrm(shape)
    if (!xfrm) return ''
    const table = firstDescendant(shape, 'tbl')
    if (table) return renderTable(table, xfrm, transform, theme, defaultColor)
    return ''
  }

  if (!['sp', 'pic', 'cxnSp'].includes(tag)) return ''

  const xfrm = readXfrm(shape)
  const placeholder = firstDescendant(shape, 'ph')
  const placeholderType = attribute(placeholder ?? shape, 'type') ?? 'body'
  const isTitle = placeholderType === 'title' || placeholderType === 'ctrTitle'
  let box: Box
  let rotation = 0
  let flipH = false
  let flipV = false

  if (xfrm) {
    box = { x: xfrm.x, y: xfrm.y, w: xfrm.w, h: xfrm.h }
    rotation = xfrm.rotation
    flipH = xfrm.flipH
    flipV = xfrm.flipV
  } else {
    const resolved = resolvePlaceholder(shape, layout, slideWidth, slideHeight)
    box = resolved.box
  }

  const finalBox = transform(box)

  if (tag === 'pic') {
    const blip = firstDescendant(shape, 'blip')
    const url = await resolveImage(blip, relationships, resolveMedia)
    if (!url) return ''
    const safe = sanitizeUrl(url, { allowBlob: true, allowDataImage: true })
    if (!safe) return ''
    const altElement = firstDescendant(shape, 'cNvPr')
    const alt = altElement ? (attribute(altElement, 'descr') ?? '') : ''
    return `<div class="w-file-viewer__pptx-image" style="${escapeAttribute(
      boxStyle(finalBox, rotation, flipH, flipV),
    )}"><img src="${escapeAttribute(safe)}" alt="${escapeAttribute(
      alt,
    )}" draggable="false" style="width:100%;height:100%;object-fit:fill;display:block;" /></div>`
  }

  if (tag === 'cxnSp') {
    const properties = firstDescendant(shape, 'spPr')
    const line = properties ? firstChild(properties, 'ln') : undefined
    const color = fillColor(line, theme) ?? '#64748b'
    const width = Math.max(1, emuToPx(numberAttribute(line ?? undefined, 'w', 12700)))
    const x1 = flipH ? 100 : 0
    const x2 = flipH ? 0 : 100
    const y1 = flipV ? 100 : 0
    const y2 = flipV ? 0 : 100
    return `<div class="w-file-viewer__pptx-connector" style="${escapeAttribute(
      boxStyle(finalBox, rotation),
    )}"><svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${escapeAttribute(
      color,
    )}" stroke-width="${width}" /></svg></div>`
  }

  const properties = firstDescendant(shape, 'spPr')
  const fill = fillColor(properties, theme)
  const style: string[] = [boxStyle(finalBox, rotation, flipH, flipV)]

  if (fill && fill !== 'transparent') style.push(`background:${fill};`)

  const line = properties ? firstChild(properties, 'ln') : undefined
  if (line) {
    const lineColor = fillColor(line, theme)
    const lineWidth = Math.max(1, emuToPx(numberAttribute(line, 'w', 12700)))
    if (lineColor && lineColor !== 'transparent') {
      style.push(`border:${lineWidth}px solid ${lineColor};`)
    }
  }

  const textBody = firstChild(shape, 'txBody')
  const type = placeholderType
  const defaultSizePt = type === 'title' || type === 'ctrTitle' ? 32 : type === 'subTitle' ? 20 : 18
  const shapeDefaultColor =
    fill && fill !== 'transparent' && isDarkColor(fill) ? '#ffffff' : defaultColor
  const defaultBullets =
    Boolean(placeholder) &&
    !isTitle &&
    type !== 'subTitle' &&
    type !== 'dt' &&
    type !== 'ftr' &&
    type !== 'sldNum'
  const text = textBody
    ? renderTextBody(textBody, theme, shapeDefaultColor, defaultSizePt, isTitle, defaultBullets)
    : ''

  if (!text && !(fill && fill !== 'transparent') && !line) return ''
  return `<div class="w-file-viewer__pptx-shape" style="${escapeAttribute(style.join(''))}">${text}</div>`
}

async function readLayoutInfo(
  zip: ZipReaderLike,
  path: string,
  theme: ThemeColors,
  cache: Map<string, Promise<LayoutInfo>>,
): Promise<LayoutInfo> {
  const cached = cache.get(path)
  if (cached) return cached

  const promise = (async (): Promise<LayoutInfo> => {
    if (!zip.has(path)) return { placeholders: { byKey: new Map(), byType: new Map() } }
    const document = parseXml(await zip.text(path))
    const root = firstDescendant(document, 'cSld')?.parentElement ?? document.documentElement
    let masterPlaceholders = new Map<string, Box>()
    let masterBackground: string | undefined

    try {
      const relationships = await readRelationships(zip, path)
      const master = Array.from(relationships.values()).find((relationship) =>
        relationship.type.toLowerCase().includes('slidemaster'),
      )
      if (master && zip.has(master.target)) {
        const masterDocument = parseXml(await zip.text(master.target))
        masterPlaceholders = readPlaceholders(masterDocument)
        masterBackground = slideBackground(masterDocument, theme)
      }
    } catch {
      // Master inheritance is best-effort.
    }

    const layoutPlaceholders = readPlaceholders(document)
    return {
      placeholders: mergePlaceholders(masterPlaceholders, layoutPlaceholders),
      background: slideBackground(root, theme) ?? masterBackground,
    }
  })()

  cache.set(path, promise)
  return promise
}

async function readSlidePaths(zip: ZipReaderLike, workbookPath: string): Promise<string[]> {
  const document = parseXml(await zip.text(workbookPath))
  const relationships = await readRelationships(zip, workbookPath)
  const ids = descendants(document, 'sldId')
  const paths: string[] = []

  for (const id of ids) {
    const relationId = attributeNS(id, RELATIONSHIP_NS, 'id') ?? attribute(id, 'id')
    const relationship = relationId ? relationships.get(relationId) : undefined
    if (relationship && zip.has(relationship.target)) paths.push(relationship.target)
  }

  if (paths.length > 0) return paths

  const fallback: string[] = []
  for (let index = 1; index <= 500; index += 1) {
    const path = `ppt/slides/slide${index}.xml`
    if (!zip.has(path)) break
    fallback.push(path)
  }
  return fallback
}

/**
 * Parses a PPTX archive on the main thread. Slides are bounded by
 * `options.maxSlides`; very large presentations can still block rendering.
 * Worker-based parsing is a possible future optimization.
 */
export async function parsePptx(
  zip: ZipReaderLike,
  options: PptxParseOptions,
  resolveMedia: PptxMediaResolver,
): Promise<PptxParseResult> {
  if (!zip.has('ppt/presentation.xml')) {
    throw new Error('The file is missing ppt/presentation.xml.')
  }

  const presentation = parseXml(await zip.text('ppt/presentation.xml'))
  const size = firstDescendant(presentation, 'sldSz')
  const widthEmu = numberAttribute(size ?? undefined, 'cx', DEFAULT_WIDTH) || DEFAULT_WIDTH
  const heightEmu = numberAttribute(size ?? undefined, 'cy', DEFAULT_HEIGHT) || DEFAULT_HEIGHT
  const width = emuToPx(widthEmu)
  const height = emuToPx(heightEmu)
  const theme = await readTheme(zip)
  const layoutCache = new Map<string, Promise<LayoutInfo>>()
  const slidePaths = await readSlidePaths(zip, 'ppt/presentation.xml')
  const maxSlides = Math.max(1, options.maxSlides ?? 300)
  const slides: PptxSlide[] = []

  for (const slidePath of slidePaths.slice(0, maxSlides)) {
    try {
      const slideDocument = parseXml(await zip.text(slidePath))
      const relationships = await readRelationships(zip, slidePath)
      const layoutRelationship = Array.from(relationships.values()).find((relationship) =>
        relationship.type.toLowerCase().includes('slidelayout'),
      )
      const layout: LayoutInfo = layoutRelationship
        ? await readLayoutInfo(zip, layoutRelationship.target, theme, layoutCache)
        : { placeholders: { byKey: new Map(), byType: new Map() } }

      const background = slideBackground(slideDocument, theme) ?? layout.background ?? '#ffffff'
      const defaultColor = isDarkColor(background) ? '#f8fafc' : '#1f2937'
      const root = firstDescendant(slideDocument, 'spTree')
      let html = `<div class="w-file-viewer__pptx-slide-inner" style="position:relative;width:${width}px;height:${height}px;overflow:hidden;background:${
        background === 'transparent' ? '#ffffff' : background
      };">`
      let title: string | undefined

      if (root) {
        for (const child of Array.from(root.children)) {
          if (child.localName === 'sp') {
            const placeholder = firstDescendant(child, 'ph')
            const type = placeholder ? attribute(placeholder, 'type') : undefined
            if (!title && (type === 'title' || type === 'ctrTitle' || !placeholder)) {
              const text = placeholderText(firstChild(child, 'txBody'))
              if (type === 'title' || type === 'ctrTitle') title = text || undefined
            }
          }
          html += await renderShape(
            child,
            identityTransform,
            layout.placeholders,
            theme,
            relationships,
            resolveMedia,
            widthEmu,
            heightEmu,
            defaultColor,
          )
        }
      }

      html += '</div>'
      slides.push({ html, title })
    } catch (cause) {
      console.warn(`[file-viewer] Failed to parse slide ${slidePath}.`, cause)
      slides.push({
        html: `<div class="w-file-viewer__pptx-slide-inner" style="position:relative;width:${width}px;height:${height}px;background:#ffffff;"></div>`,
      })
    }
  }

  return {
    title: await readOfficeTitle(zip),
    width,
    height,
    slides,
  }
}
