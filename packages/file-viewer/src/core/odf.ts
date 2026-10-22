import { escapeAttribute, escapeHtml, sanitizeUrl } from './format'
import { resolveZipPath, type ZipReaderLike } from './zip'
import {
  XLINK_NS,
  attribute,
  attributeNS,
  children,
  descendants,
  firstChild,
  firstDescendant,
  parseXml,
} from './xml'

export interface OdfSheet {
  name: string
  html: string
  rowCount: number
  columnCount: number
  truncated: boolean
}

export interface OdfPresentationSlide {
  html: string
  title?: string
}

export type OdfMediaResolver = (path: string) => Promise<string | null>

const ODF_ALIGNMENTS = new Set(['left', 'center', 'right', 'justify', 'start', 'end'])

function normalizeOdfAlignment(value: string | undefined): string | undefined {
  if (!value) return undefined
  return ODF_ALIGNMENTS.has(value) ? value : undefined
}

function normalizeOdfLineHeight(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const percent = /^([\d.]+)%$/.exec(value)
  if (percent) return String(Number.parseFloat(percent[1] ?? '100') / 100)
  if (/^\d+(?:\.\d+)?$/.test(value)) return value
  return undefined
}

interface OdfTextStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  color?: string
  size?: number
  background?: string
}

interface OdfParagraphStyle {
  alignment?: string
  marginTop?: number
  marginBottom?: number
  marginLeft?: number
  marginRight?: number
  textIndent?: number
  lineHeight?: string
  breakBefore?: boolean
}

interface OdfCellStyle {
  background?: string
  border?: string
}

interface OdfStyle {
  name: string
  family: string
  parent?: string
  text: OdfTextStyle
  paragraph: OdfParagraphStyle
  cell: OdfCellStyle
}

interface OdfContext {
  zip: ZipReaderLike
  styles: Map<string, OdfStyle>
  styleCache: Map<string, OdfStyle>
  resolvingStyles: Set<string>
  orderedLists: Set<string>
  resolveMedia: OdfMediaResolver
  maxRows: number
  maxColumns: number
  locale: string
}

function normalizeColor(value: string | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed
      .slice(1)
      .split('')
      .map((character) => character + character)
      .join('')}`
  }
  return undefined
}

function lengthToPx(value: string | undefined): number | undefined {
  if (!value) return undefined
  const match = /^(-?[\d.]+)\s*(cm|mm|in|pt|pc|px|em|rem)?$/i.exec(value.trim())
  if (!match) return undefined
  const amount = Number.parseFloat(match[1] ?? '')
  if (!Number.isFinite(amount)) return undefined
  switch ((match[2] ?? 'px').toLowerCase()) {
    case 'cm':
      return amount * 37.7952755906
    case 'mm':
      return amount * 3.77952755906
    case 'in':
      return amount * 96
    case 'pt':
      return amount * (96 / 72)
    case 'pc':
      return amount * 16
    case 'em':
    case 'rem':
      return amount * 16
    default:
      return amount
  }
}

function readTextStyle(properties: Element | undefined): OdfTextStyle {
  if (!properties) return {}
  const style: OdfTextStyle = {}
  const weight = attribute(properties, 'font-weight')
  if (weight) style.bold = weight === 'bold' || (Number.parseFloat(weight) || 0) >= 600
  const fontStyle = attribute(properties, 'font-style')
  if (fontStyle) style.italic = fontStyle === 'italic' || fontStyle === 'oblique'
  const underline = attribute(properties, 'text-underline-style')
  if (underline) style.underline = underline !== 'none'
  const lineThrough = attribute(properties, 'text-line-through-style')
  if (lineThrough) style.strike = lineThrough !== 'none'
  const color = normalizeColor(attribute(properties, 'color'))
  if (color) style.color = color
  const background = normalizeColor(
    attribute(properties, 'background-color') ?? attribute(properties, 'text-background-color'),
  )
  if (background) style.background = background
  const size = lengthToPx(attribute(properties, 'font-size'))
  if (size) style.size = size
  return style
}

function readParagraphStyle(properties: Element | undefined): OdfParagraphStyle {
  if (!properties) return {}
  const style: OdfParagraphStyle = {}
  const alignment = normalizeOdfAlignment(attribute(properties, 'text-align') ?? undefined)
  if (alignment) style.alignment = alignment
  style.marginTop = lengthToPx(attribute(properties, 'margin-top'))
  style.marginBottom = lengthToPx(attribute(properties, 'margin-bottom'))
  style.marginLeft = lengthToPx(attribute(properties, 'margin-left'))
  style.marginRight = lengthToPx(attribute(properties, 'margin-right'))
  style.textIndent = lengthToPx(attribute(properties, 'text-indent'))
  if (attribute(properties, 'break-before') === 'page') style.breakBefore = true
  const lineHeight = normalizeOdfLineHeight(attribute(properties, 'line-height'))
  if (lineHeight) style.lineHeight = lineHeight
  return style
}

function readCellStyle(properties: Element | undefined): OdfCellStyle {
  if (!properties) return {}
  const style: OdfCellStyle = {}
  const background = normalizeColor(
    attribute(properties, 'background-color') ?? attribute(properties, 'fill-color'),
  )
  if (background) style.background = background
  const border = attribute(properties, 'border')
  if (
    border &&
    /^(?:[\d.]+(?:pt|px|cm|mm))\s+(?:solid|dashed|dotted)\s+#[0-9a-f]{6}$/i.test(border.trim())
  ) {
    style.border = border.trim()
  }
  return style
}

function readStyleElement(element: Element): OdfStyle {
  return {
    name: attribute(element, 'name') ?? '',
    family: attribute(element, 'family') ?? 'paragraph',
    parent: attribute(element, 'parent-style-name'),
    text: readTextStyle(firstChild(element, 'text-properties')),
    paragraph: readParagraphStyle(firstChild(element, 'paragraph-properties')),
    cell: readCellStyle(firstChild(element, 'table-cell-properties')),
  }
}

async function readOdfStyles(zip: ZipReaderLike): Promise<{
  styles: Map<string, OdfStyle>
  orderedLists: Set<string>
}> {
  const styles = new Map<string, OdfStyle>()
  const orderedLists = new Set<string>()

  for (const path of ['styles.xml', 'content.xml']) {
    if (!zip.has(path)) continue
    try {
      const document = parseXml(await zip.text(path))
      for (const element of descendants(document, 'style')) {
        const style = readStyleElement(element)
        if (!style.name) continue
        styles.set(`${style.family}:${style.name}`, style)
      }
      for (const listStyle of descendants(document, 'list-style')) {
        const name = attribute(listStyle, 'name')
        if (!name) continue
        if (descendants(listStyle, 'list-level-style-number').length > 0) {
          orderedLists.add(name)
        }
      }
    } catch {
      // Styles are best-effort.
    }
  }

  return { styles, orderedLists }
}

function resolveStyle(context: OdfContext, name: string | undefined, family: string): OdfStyle {
  const empty: OdfStyle = { name: '', family, text: {}, paragraph: {}, cell: {} }
  if (!name) return empty
  const key = `${family}:${name}`
  const cached = context.styleCache.get(key)
  if (cached) return cached
  if (context.resolvingStyles.has(key)) return empty

  const own = context.styles.get(key) ?? context.styles.get(`paragraph:${name}`)
  if (!own) return empty

  const resolved: OdfStyle = {
    name: own.name,
    family: own.family,
    parent: own.parent,
    text: { ...own.text },
    paragraph: { ...own.paragraph },
    cell: { ...own.cell },
  }

  context.resolvingStyles.add(key)
  if (own.parent) {
    const parent = resolveStyle(context, own.parent, own.family || family)
    resolved.text = { ...parent.text, ...resolved.text }
    resolved.paragraph = { ...parent.paragraph, ...resolved.paragraph }
    resolved.cell = { ...parent.cell, ...resolved.cell }
  }
  context.resolvingStyles.delete(key)

  context.styleCache.set(key, resolved)
  return resolved
}

function textStyleCss(style: OdfTextStyle): string {
  const declarations: string[] = []
  if (style.bold) declarations.push('font-weight:600')
  if (style.italic) declarations.push('font-style:italic')
  const decoration: string[] = []
  if (style.underline) decoration.push('underline')
  if (style.strike) decoration.push('line-through')
  if (decoration.length) declarations.push(`text-decoration:${decoration.join(' ')}`)
  if (style.color) {
    // Expose the authored color as a custom property so dark themes can
    // override it without losing the original light-theme palette.
    declarations.push(`--w-cell-color:${style.color}`)
    declarations.push('color:var(--w-cell-color, inherit)')
  }
  if (style.background) declarations.push(`background-color:${style.background}`)
  if (style.size) declarations.push(`font-size:${Math.round(style.size * 100) / 100}px`)
  return declarations.join(';')
}

function paragraphStyleCss(
  text: OdfTextStyle,
  paragraph: OdfParagraphStyle,
  fallback?: { size?: number; bold?: boolean },
): string {
  const declarations: string[] = []
  if (fallback?.size) declarations.push(`font-size:${fallback.size}px`)
  if (fallback?.bold) declarations.push('font-weight:600')
  const base = textStyleCss(text)
  if (base) declarations.push(base)
  const alignment = normalizeOdfAlignment(paragraph.alignment)
  if (alignment) declarations.push(`text-align:${alignment}`)
  if (paragraph.marginTop !== undefined) declarations.push(`margin-top:${paragraph.marginTop}px`)
  if (paragraph.marginBottom !== undefined)
    declarations.push(`margin-bottom:${paragraph.marginBottom}px`)
  if (paragraph.marginLeft !== undefined) declarations.push(`margin-left:${paragraph.marginLeft}px`)
  if (paragraph.marginRight !== undefined)
    declarations.push(`margin-right:${paragraph.marginRight}px`)
  if (paragraph.textIndent !== undefined) declarations.push(`text-indent:${paragraph.textIndent}px`)
  if (paragraph.lineHeight) declarations.push(`line-height:${paragraph.lineHeight}`)
  return declarations.join(';')
}

function nodeText(node: Node): string {
  return node.textContent ?? ''
}

async function renderFrame(frame: Element, context: OdfContext, basePath: string): Promise<string> {
  const image = firstDescendant(frame, 'image')
  if (image) {
    const href = attributeNS(image, XLINK_NS, 'href') ?? attribute(image, 'href') ?? ''
    if (!href) return ''
    let url = href
    if (!/^(https?:|data:image\/)/i.test(href)) {
      const path = resolveZipPath(basePath, href)
      url = (await context.resolveMedia(path)) ?? ''
    }
    const safe = url ? sanitizeUrl(url, { allowBlob: true, allowDataImage: true }) : null
    if (!safe) return ''
    const width = lengthToPx(attribute(frame, 'width'))
    const height = lengthToPx(attribute(frame, 'height'))
    return `<img class="w-file-viewer__odf-image" src="${escapeAttribute(safe)}" alt=""${
      width ? ` width="${Math.round(width)}"` : ''
    }${height ? ` height="${Math.round(height)}"` : ''} />`
  }

  const textBox = firstDescendant(frame, 'text-box')
  if (textBox) {
    let html = ''
    for (const child of Array.from(textBox.children)) {
      if (child.localName === 'p' || child.localName === 'h') {
        html += await renderParagraph(child, context)
      } else if (child.localName === 'list') {
        html += await renderList(child, context)
      }
    }
    return `<div class="w-file-viewer__odf-frame">${html}</div>`
  }

  return ''
}

async function renderInline(node: Element, context: OdfContext, basePath: string): Promise<string> {
  let html = ''

  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 3) {
      const text = nodeText(child)
      if (!text.trim() && text.includes('\n')) continue
      html += escapeHtml(text)
      continue
    }
    if (child.nodeType !== 1) continue
    const element = child as Element

    switch (element.localName) {
      case 'span': {
        const style = resolveStyle(context, attribute(element, 'style-name'), 'text')
        const css = textStyleCss(style.text)
        const inner = await renderInline(element, context, basePath)
        html += css ? `<span style="${escapeAttribute(css)}">${inner}</span>` : inner
        break
      }
      case 'a': {
        const href = attributeNS(element, XLINK_NS, 'href') ?? attribute(element, 'href') ?? ''
        const safe = sanitizeUrl(href)
        const inner = await renderInline(element, context, basePath)
        if (!safe) {
          html += inner
          break
        }
        const external = /^https?:\/\//i.test(safe)
        html += `<a href="${escapeAttribute(safe)}"${
          external ? ' target="_blank" rel="noopener noreferrer"' : ''
        }>${inner}</a>`
        break
      }
      case 'line-break': {
        html += '<br />'
        break
      }
      case 'tab': {
        html += '<span class="w-file-viewer__odf-tab"></span>'
        break
      }
      case 's': {
        const count = Number.parseInt(attribute(element, 'c') ?? '1', 10) || 1
        html += ' '.repeat(Math.min(count, 100))
        break
      }
      case 'frame': {
        html += await renderFrame(element, context, basePath)
        break
      }
      case 'note': {
        break
      }
      case 'bookmark':
      case 'bookmark-start':
      case 'bookmark-end':
      case 'soft-page-break': {
        break
      }
      default: {
        html += await renderInline(element, context, basePath)
      }
    }
  }

  return html
}

const HEADING_SIZES = [32, 27, 24, 21, 18, 16]

async function renderParagraph(
  paragraph: Element,
  context: OdfContext,
  basePath = 'content.xml',
): Promise<string> {
  const style = resolveStyle(context, attribute(paragraph, 'style-name'), 'paragraph')
  const isHeading = paragraph.localName === 'h'
  const level = isHeading
    ? Math.min(
        6,
        Math.max(1, Number.parseInt(attribute(paragraph, 'outline-level') ?? '1', 10) || 1),
      )
    : undefined
  const fallback = level ? { size: HEADING_SIZES[level - 1], bold: true } : undefined
  const css = paragraphStyleCss(style.text, style.paragraph, fallback)
  const inner = await renderInline(paragraph, context, basePath)
  const classes = `w-file-viewer__odf-paragraph${level ? ` w-file-viewer__odf-heading w-file-viewer__odf-heading--${level}` : ''}`
  return `<p class="${classes}"${css ? ` style="${escapeAttribute(css)}"` : ''}>${inner || '&#8203;'}</p>`
}

async function renderList(
  list: Element,
  context: OdfContext,
  basePath = 'content.xml',
): Promise<string> {
  const ordered = context.orderedLists.has(attribute(list, 'style-name') ?? '')
  const items = children(list, 'list-item')
  let html = `<${ordered ? 'ol' : 'ul'} class="w-file-viewer__odf-list">`
  for (const item of items) {
    let content = ''
    for (const child of Array.from(item.children)) {
      if (child.localName === 'p' || child.localName === 'h') {
        content += await renderParagraph(child, context, basePath)
      } else if (child.localName === 'list') {
        content += await renderList(child, context, basePath)
      }
    }
    html += `<li>${content || '&#8203;'}</li>`
  }
  html += `</${ordered ? 'ol' : 'ul'}>`
  return html
}

async function renderOdtTable(
  table: Element,
  context: OdfContext,
  basePath = 'content.xml',
): Promise<string> {
  let html = '<table class="w-file-viewer__odf-table"><tbody>'
  let renderedRows = 0

  for (const row of children(table, 'table-row')) {
    const repeatRows = Math.min(
      Number.parseInt(attribute(row, 'number-rows-repeated') ?? '1', 10) || 1,
      Math.max(1, context.maxRows - renderedRows),
    )
    for (let repeat = 0; repeat < repeatRows; repeat += 1) {
      if (renderedRows >= context.maxRows) break
      let cellCount = 0
      let rowHtml = '<tr>'
      for (const cell of Array.from(row.children)) {
        if (cell.localName !== 'table-cell' && cell.localName !== 'covered-table-cell') continue
        if (cell.localName === 'covered-table-cell') continue
        const repeatColumns = Math.min(
          Number.parseInt(attribute(cell, 'number-columns-repeated') ?? '1', 10) || 1,
          Math.max(1, context.maxColumns - cellCount),
        )
        const colspan = Number.parseInt(attribute(cell, 'number-columns-spanned') ?? '1', 10) || 1
        const rowspan = Number.parseInt(attribute(cell, 'number-rows-spanned') ?? '1', 10) || 1
        const style = resolveStyle(context, attribute(cell, 'style-name'), 'table-cell')
        const cellCss: string[] = []
        const textCss = textStyleCss(style.text)
        if (textCss) cellCss.push(textCss)
        if (style.cell.background) cellCss.push(`background-color:${style.cell.background}`)
        if (style.cell.border) cellCss.push(`border:${style.cell.border}`)

        let content = ''
        for (const child of Array.from(cell.children)) {
          if (child.localName === 'p' || child.localName === 'h') {
            content += await renderParagraph(child, context, basePath)
          } else if (child.localName === 'list') {
            content += await renderList(child, context, basePath)
          } else if (child.localName === 'table') {
            content += await renderOdtTable(child, context, basePath)
          }
        }

        for (let repeatColumn = 0; repeatColumn < repeatColumns; repeatColumn += 1) {
          if (cellCount >= context.maxColumns) break
          rowHtml += `<td${repeatColumn === 0 && colspan > 1 ? ` colspan="${colspan}"` : ''}${
            repeatColumn === 0 && rowspan > 1 ? ` rowspan="${rowspan}"` : ''
          }${cellCss.length > 0 ? ` style="${escapeAttribute(cellCss.join(';'))}"` : ''}>${content || '&#8203;'}</td>`
          cellCount += repeatColumn === 0 ? colspan : 1
        }
      }
      rowHtml += '</tr>'
      html += rowHtml
      renderedRows += 1
    }
  }

  html += '</tbody></table>'
  return html
}

async function renderOdtBlocks(
  parent: Element,
  context: OdfContext,
  pages: string[],
  basePath = 'content.xml',
): Promise<void> {
  let current: string[] = []
  const flush = () => {
    if (current.length > 0) pages.push(current.join(''))
    current = []
  }

  for (const child of Array.from(parent.children)) {
    const name = child.localName
    if (name === 'h' || name === 'p') {
      const style = resolveStyle(context, attribute(child, 'style-name'), 'paragraph')
      if (style.paragraph.breakBefore) flush()
      current.push(await renderParagraph(child, context, basePath))
    } else if (name === 'list') {
      current.push(await renderList(child, context, basePath))
    } else if (name === 'table') {
      current.push(await renderOdtTable(child, context, basePath))
    } else if (name === 'section') {
      await renderOdtBlocks(child, context, pages, basePath)
    } else if (name === 'frame') {
      current.push(await renderFrame(child, context, basePath))
    } else if (name === 'soft-page-break') {
      flush()
    } else if (child.children.length > 0) {
      await renderOdtBlocks(child, context, pages, basePath)
    }
  }
  flush()
}

export async function parseOdt(
  zip: ZipReaderLike,
  resolveMedia: OdfMediaResolver,
  locale = 'en',
): Promise<{ pages: string[] }> {
  if (!zip.has('content.xml')) throw new Error('The OpenDocument text has no content.xml.')
  const document = parseXml(await zip.text('content.xml'))
  const body = firstDescendant(document, 'text')
  if (!body) throw new Error('The OpenDocument text has no body.')

  const { styles, orderedLists } = await readOdfStyles(zip)
  const context: OdfContext = {
    zip,
    styles,
    styleCache: new Map(),
    resolvingStyles: new Set(),
    orderedLists,
    resolveMedia,
    maxRows: 5000,
    maxColumns: 200,
    locale,
  }

  const pages: string[] = []
  await renderOdtBlocks(body, context, pages)
  return { pages }
}

function odsCellContent(cell: Element, locale: string): string {
  const type = attribute(cell, 'value-type')
  const paragraphs = descendants(cell, 'p')
  const text = paragraphs
    .map((paragraph) => paragraph.textContent ?? '')
    .join('\n')
    .trim()
  if (text) return text

  if (type === 'date') {
    const raw = attribute(cell, 'date-value')
    if (raw) {
      const date = new Date(raw)
      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
          date,
        )
      }
    }
  }
  if (type === 'boolean') return attribute(cell, 'boolean-value') === 'true' ? 'TRUE' : 'FALSE'
  if (type === 'float' || type === 'percentage' || type === 'currency') {
    return attribute(cell, 'value') ?? ''
  }
  return attribute(cell, 'string-value') ?? ''
}

export async function parseOds(
  zip: ZipReaderLike,
  options: { maxRows?: number; maxColumns?: number; showGrid?: boolean; locale?: string } = {},
): Promise<{ sheets: OdfSheet[] }> {
  if (!zip.has('content.xml')) throw new Error('The OpenDocument spreadsheet has no content.xml.')
  const document = parseXml(await zip.text('content.xml'))
  const spreadsheet = firstDescendant(document, 'spreadsheet')
  if (!spreadsheet) throw new Error('The OpenDocument spreadsheet has no body.')

  const { styles, orderedLists } = await readOdfStyles(zip)
  const context: OdfContext = {
    zip,
    styles,
    styleCache: new Map(),
    resolvingStyles: new Set(),
    orderedLists,
    resolveMedia: async () => null,
    maxRows: Math.max(1, options.maxRows ?? 5000),
    maxColumns: Math.max(1, options.maxColumns ?? 200),
    locale: options.locale ?? 'en',
  }

  const sheets: OdfSheet[] = []

  for (const table of children(spreadsheet, 'table')) {
    const name = attribute(table, 'name') ?? `Sheet${sheets.length + 1}`
    let html = `<table class="w-file-viewer__odf-table w-file-viewer__xlsx-table${
      options.showGrid === false ? '' : ' has-grid'
    }"><tbody>`
    let rowCount = 0
    let columnCount = 0
    let truncated = false

    for (const row of children(table, 'table-row')) {
      const repeat = Number.parseInt(attribute(row, 'number-rows-repeated') ?? '1', 10) || 1
      for (let rowRepeat = 0; rowRepeat < repeat; rowRepeat += 1) {
        if (rowCount >= context.maxRows) {
          truncated = true
          break
        }
        let htmlRow = '<tr>'
        let column = 0
        for (const cell of Array.from(row.children)) {
          if (cell.localName !== 'table-cell' && cell.localName !== 'covered-table-cell') continue
          const cellRepeat =
            Number.parseInt(attribute(cell, 'number-columns-repeated') ?? '1', 10) || 1
          const colspan = Number.parseInt(attribute(cell, 'number-columns-spanned') ?? '1', 10) || 1
          const rowspan = Number.parseInt(attribute(cell, 'number-rows-spanned') ?? '1', 10) || 1
          if (cell.localName === 'covered-table-cell') continue

          const style = resolveStyle(context, attribute(cell, 'style-name'), 'table-cell')
          const css: string[] = []
          const textCss = textStyleCss(style.text)
          if (textCss) css.push(textCss)
          if (style.cell.background) css.push(`background-color:${style.cell.background}`)
          if (style.cell.border) css.push(`border:${style.cell.border}`)
          const text = odsCellContent(cell, context.locale)
          const safe = escapeHtml(text).replace(/\n/g, '<br />')

          for (let cellRepeatIndex = 0; cellRepeatIndex < cellRepeat; cellRepeatIndex += 1) {
            if (column >= context.maxColumns) {
              truncated = true
              break
            }
            htmlRow += `<td${cellRepeatIndex === 0 && colspan > 1 ? ` colspan="${colspan}"` : ''}${
              cellRepeatIndex === 0 && rowspan > 1 ? ` rowspan="${rowspan}"` : ''
            }${css.length > 0 ? ` style="${escapeAttribute(css.join(';'))}"` : ''}>${safe || '&nbsp;'}</td>`
            column += cellRepeatIndex === 0 ? colspan : 1
          }
        }
        htmlRow += '</tr>'
        html += htmlRow
        rowCount += 1
        columnCount = Math.max(columnCount, column)
      }
      if (rowCount >= context.maxRows) {
        truncated = true
        break
      }
    }

    html += '</tbody></table>'
    sheets.push({
      name,
      html: rowCount > 0 ? html : '',
      rowCount,
      columnCount,
      truncated,
    })
  }

  return { sheets }
}

function readOdpPageSize(zip: ZipReaderLike): Promise<{ width: number; height: number }> {
  return (async () => {
    if (!zip.has('styles.xml')) return { width: 960, height: 540 }
    try {
      const document = parseXml(await zip.text('styles.xml'))
      for (const properties of descendants(document, 'page-layout-properties')) {
        const width = lengthToPx(attribute(properties, 'page-width'))
        const height = lengthToPx(attribute(properties, 'page-height'))
        if (width && height) return { width, height }
      }
    } catch {
      // Use defaults.
    }
    return { width: 960, height: 540 }
  })()
}

async function renderOdpFrame(
  frame: Element,
  context: OdfContext,
  basePath: string,
): Promise<string> {
  const x = lengthToPx(attribute(frame, 'x')) ?? 0
  const y = lengthToPx(attribute(frame, 'y')) ?? 0
  const width = lengthToPx(attribute(frame, 'width')) ?? 400
  const height = lengthToPx(attribute(frame, 'height')) ?? 200

  const image = firstDescendant(frame, 'image')
  if (image) {
    const href = attributeNS(image, XLINK_NS, 'href') ?? attribute(image, 'href') ?? ''
    if (!href) return ''
    let url = href
    if (!/^(https?:|data:image\/)/i.test(href)) {
      url = (await context.resolveMedia(resolveZipPath(basePath, href))) ?? ''
    }
    const safe = url ? sanitizeUrl(url, { allowBlob: true, allowDataImage: true }) : null
    if (!safe) return ''
    return `<div style="position:absolute;left:${x}px;top:${y}px;width:${width}px;height:${height}px;"><img src="${escapeAttribute(
      safe,
    )}" alt="" style="width:100%;height:100%;object-fit:contain;" /></div>`
  }

  const textBox = firstDescendant(frame, 'text-box') ?? firstDescendant(frame, 'custom-shape')
  if (!textBox) return ''

  let content = ''
  for (const child of Array.from(textBox.children)) {
    if (child.localName === 'p' || child.localName === 'h') {
      content += await renderParagraph(child, context, basePath)
    } else if (child.localName === 'list') {
      content += await renderList(child, context, basePath)
    }
  }

  return `<div class="w-file-viewer__odf-frame" style="position:absolute;left:${x}px;top:${y}px;width:${width}px;height:${height}px;overflow:hidden;">${content}</div>`
}

export async function parseOdp(
  zip: ZipReaderLike,
  resolveMedia: OdfMediaResolver,
  options: { maxSlides?: number; locale?: string } = {},
): Promise<{ width: number; height: number; slides: OdfPresentationSlide[] }> {
  if (!zip.has('content.xml')) throw new Error('The OpenDocument presentation has no content.xml.')
  const document = parseXml(await zip.text('content.xml'))
  const presentation = firstDescendant(document, 'presentation')
  if (!presentation) throw new Error('The OpenDocument presentation has no slides.')

  const { styles, orderedLists } = await readOdfStyles(zip)
  const context: OdfContext = {
    zip,
    styles,
    styleCache: new Map(),
    resolvingStyles: new Set(),
    orderedLists,
    resolveMedia,
    maxRows: 5000,
    maxColumns: 200,
    locale: options.locale ?? 'en',
  }
  const { width, height } = await readOdpPageSize(zip)
  const maxSlides = Math.max(1, options.maxSlides ?? 300)
  const slides: OdfPresentationSlide[] = []

  for (const page of descendants(presentation, 'page').slice(0, maxSlides)) {
    let content = ''
    let title: string | undefined
    for (const frame of Array.from(page.children)) {
      if (
        frame.localName === 'frame' ||
        frame.localName === 'custom-shape' ||
        frame.localName === 'group'
      ) {
        content += await renderOdpFrame(frame, context, 'content.xml')
      }
      if (!title) {
        const firstParagraph = firstDescendant(frame, 'p')
        const text = firstParagraph?.textContent?.trim()
        if (text) title = text
      }
    }
    slides.push({
      title,
      html: `<div class="w-file-viewer__pptx-slide-inner" style="position:relative;width:${width}px;height:${height}px;overflow:hidden;background:#ffffff;">${content}</div>`,
    })
  }

  return { width, height, slides }
}
