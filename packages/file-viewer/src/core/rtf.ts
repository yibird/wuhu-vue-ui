import { escapeAttribute, escapeHtml } from './format'

interface RtfState {
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  hidden: boolean
  superscript: boolean
  subscript: boolean
  fontSize: number
  colorIndex: number
  highlightIndex: number
  fontIndex: number
  alignment: 'left' | 'center' | 'right' | 'justify'
  skip: boolean
}

interface RtfContext {
  colors: string[]
  fonts: Map<number, string>
  stack: RtfState[]
  state: RtfState
  paragraphs: string[]
  runs: string[]
  pendingText: string
  pendingCss: string
  codepage: string
}

const SKIP_DESTINATIONS = new Set([
  'fonttbl',
  'colortbl',
  'stylesheet',
  'info',
  'pict',
  'object',
  'header',
  'headerl',
  'headerr',
  'headerf',
  'footer',
  'footerl',
  'footerr',
  'footerf',
  'footnote',
  'endnote',
  'annotation',
  'fldinst',
  'listtable',
  'listoverridetable',
  'rsidtbl',
  'generator',
  'xmlnstbl',
  'themedata',
  'colorschememapping',
  'latentstyles',
  'datastore',
  'mmathPr',
  'pgptbl',
  'pnptbl',
  'revtbl',
])

const CODEPAGES: Record<number, string> = {
  1250: 'windows-1250',
  1251: 'windows-1251',
  1252: 'windows-1252',
  1253: 'windows-1253',
  1254: 'windows-1254',
  1255: 'windows-1255',
  1256: 'windows-1256',
  1257: 'windows-1257',
  1258: 'windows-1258',
  936: 'gbk',
  950: 'big5',
  932: 'shift_jis',
  949: 'euc-kr',
  65001: 'utf-8',
}

function defaultState(): RtfState {
  return {
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    hidden: false,
    superscript: false,
    subscript: false,
    fontSize: 0,
    colorIndex: 0,
    highlightIndex: 0,
    fontIndex: 0,
    alignment: 'left',
    skip: false,
  }
}

function parseColorTable(source: string): string[] {
  const start = source.indexOf('{\\colortbl')
  if (start < 0) return ['']
  const end = source.indexOf('}', start)
  if (end < 0) return ['']

  const colors = ['']
  for (const entry of source.slice(start + 11, end).split(';')) {
    const red = /\\red(\d+)/.exec(entry)?.[1]
    const green = /\\green(\d+)/.exec(entry)?.[1]
    const blue = /\\blue(\d+)/.exec(entry)?.[1]
    if (red === undefined || green === undefined || blue === undefined) {
      colors.push('')
      continue
    }
    const toHex = (value: string) =>
      Math.min(255, Number.parseInt(value, 10) || 0)
        .toString(16)
        .padStart(2, '0')
    colors.push(`#${toHex(red)}${toHex(green)}${toHex(blue)}`)
  }
  return colors
}

function parseFontTable(source: string): Map<number, string> {
  const result = new Map<number, string>()
  const start = source.indexOf('{\\fonttbl')
  if (start < 0) return result

  let depth = 0
  let end = start
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    else if (source[index] === '}') {
      depth -= 1
      if (depth === 0) {
        end = index
        break
      }
    }
  }

  const table = source.slice(start, end + 1)
  for (const entry of table.matchAll(/{\\f(\d+)[^{}]*?([^{};]+);}/g)) {
    const id = Number.parseInt(entry[1] ?? '', 10)
    const name = (entry[2] ?? '')
      .replace(/\\[a-z]+-?\d*\s?/gi, '')
      .replace(/[{}]/g, '')
      .replace(/["'\\;<>]/g, '')
      .trim()
    if (Number.isFinite(id) && name) result.set(id, name)
  }
  return result
}

function stateToCss(context: RtfContext): string {
  const state = context.state
  const declarations: string[] = []
  if (state.bold) declarations.push('font-weight:700')
  if (state.italic) declarations.push('font-style:italic')
  const decoration: string[] = []
  if (state.underline) decoration.push('underline')
  if (state.strike) decoration.push('line-through')
  if (decoration.length) declarations.push(`text-decoration:${decoration.join(' ')}`)
  if (state.superscript) declarations.push('vertical-align:super;font-size:smaller')
  if (state.subscript) declarations.push('vertical-align:sub;font-size:smaller')
  if (state.fontSize) {
    declarations.push(`font-size:${Math.round((state.fontSize / 2) * (4 / 3) * 100) / 100}px`)
  }
  const color = context.colors[state.colorIndex]
  if (color) declarations.push(`color:${color}`)
  const highlight = context.colors[state.highlightIndex]
  if (highlight) declarations.push(`background-color:${highlight}`)
  const font = context.fonts.get(state.fontIndex)
  if (font) declarations.push(`font-family:"${font}"`)
  return declarations.join(';')
}

function flushRun(context: RtfContext) {
  if (!context.pendingText) return
  const escaped = escapeHtml(context.pendingText)
  context.runs.push(
    context.pendingCss
      ? `<span style="${escapeAttribute(context.pendingCss)}">${escaped}</span>`
      : escaped,
  )
  context.pendingText = ''
}

function pushText(context: RtfContext, text: string) {
  if (!text || context.state.skip || context.state.hidden) return
  const css = stateToCss(context)
  if (css !== context.pendingCss) {
    flushRun(context)
    context.pendingCss = css
  }
  context.pendingText += text
}

function pushHtml(context: RtfContext, html: string) {
  if (context.state.skip || context.state.hidden) return
  flushRun(context)
  context.runs.push(html)
}

function flushParagraph(context: RtfContext) {
  flushRun(context)
  if (context.runs.length === 0) {
    if (context.paragraphs.length === 0) {
      context.paragraphs.push('<p class="w-file-viewer__rtf-paragraph">&#8203;</p>')
    }
    return
  }
  const angle =
    context.state.alignment === 'center'
      ? 'center'
      : context.state.alignment === 'right'
        ? 'right'
        : context.state.alignment === 'justify'
          ? 'justify'
          : 'left'
  context.paragraphs.push(
    `<p class="w-file-viewer__rtf-paragraph" style="text-align:${angle}">${context.runs.join('')}</p>`,
  )
  context.runs = []
}

function decodeBytes(bytes: number[], codepage: string): string {
  try {
    return new TextDecoder(codepage, { fatal: false }).decode(new Uint8Array(bytes))
  } catch {
    return new TextDecoder('windows-1252', { fatal: false }).decode(new Uint8Array(bytes))
  }
}

function handleControl(context: RtfContext, word: string, parameter: number | undefined) {
  const state = context.state
  const off = parameter === 0

  if (SKIP_DESTINATIONS.has(word)) {
    state.skip = true
    return
  }

  switch (word) {
    case 'b':
      state.bold = !off
      break
    case 'i':
      state.italic = !off
      break
    case 'ul':
      state.underline = !off
      break
    case 'ulnone':
      state.underline = false
      break
    case 'strike':
      state.strike = !off
      break
    case 'v':
      state.hidden = !off
      break
    case 'super':
      state.superscript = true
      state.subscript = false
      break
    case 'sub':
      state.subscript = true
      state.superscript = false
      break
    case 'nosupersub':
      state.superscript = false
      state.subscript = false
      break
    case 'fs':
      state.fontSize = parameter && parameter > 0 ? parameter : 0
      break
    case 'cf':
      state.colorIndex = parameter ?? 0
      break
    case 'highlight':
      state.highlightIndex = parameter ?? 0
      break
    case 'f':
      state.fontIndex = parameter ?? 0
      break
    case 'ql':
      state.alignment = 'left'
      break
    case 'qc':
      state.alignment = 'center'
      break
    case 'qr':
      state.alignment = 'right'
      break
    case 'qj':
      state.alignment = 'justify'
      break
    case 'pard':
      state.alignment = 'left'
      break
    case 'plain':
      Object.assign(state, defaultState(), {
        alignment: state.alignment,
        skip: state.skip,
      })
      break
    case 'ansicpg':
      if (parameter) context.codepage = CODEPAGES[parameter] ?? context.codepage
      break
    case 'par':
    case 'sect':
    case 'page':
      if (!state.skip) flushParagraph(context)
      break
    case 'line':
      if (!state.skip) pushText(context, '\n')
      break
    case 'tab':
      pushHtml(context, '<span class="w-file-viewer__rtf-tab"></span>')
      break
    case 'emdash':
      pushText(context, '\u2014')
      break
    case 'endash':
      pushText(context, '\u2013')
      break
    case 'lquote':
      pushText(context, '\u2018')
      break
    case 'rquote':
      pushText(context, '\u2019')
      break
    case 'ldblquote':
      pushText(context, '\u201c')
      break
    case 'rdblquote':
      pushText(context, '\u201d')
      break
    case 'bullet':
      pushText(context, '\u2022')
      break
    default:
      break
  }
}

/**
 * Convert a subset of RTF to safe HTML. Supports groups, character styles,
 * colors, fonts, alignment, paragraphs, tabs, unicode and code-page escapes.
 */
export function parseRtf(source: string): string {
  const context: RtfContext = {
    colors: parseColorTable(source),
    fonts: parseFontTable(source),
    stack: [],
    state: defaultState(),
    paragraphs: [],
    runs: [],
    pendingText: '',
    pendingCss: '',
    codepage: 'windows-1252',
  }

  let index = 0
  while (index < source.length) {
    const character = source[index] ?? ''

    if (character === '{') {
      context.stack.push({ ...context.state })
      index += 1
      continue
    }

    if (character === '}') {
      const previous = context.stack.pop()
      if (previous) context.state = previous
      index += 1
      continue
    }

    if (character === '\\') {
      index += 1
      const next = source[index] ?? ''

      if (/[a-z]/i.test(next)) {
        let end = index + 1
        while (end < source.length && /[a-z]/i.test(source[end] ?? '')) end += 1
        const word = source.slice(index, end)
        let parameter: number | undefined
        let sign = 1
        if (source[end] === '-') {
          sign = -1
          end += 1
        }
        const numberStart = end
        while (end < source.length && /\d/.test(source[end] ?? '')) end += 1
        if (end > numberStart) {
          parameter = sign * Number.parseInt(source.slice(numberStart, end), 10)
        }
        if (source[end] === ' ') end += 1

        if (word === 'u' && parameter !== undefined) {
          const code = parameter < 0 ? parameter + 65536 : parameter
          pushText(context, String.fromCharCode(code))
          // Skip the fallback character.
          if (source[end] === '?') end += 1
          else if (source[end] === '\\' && source[end + 1] === "'") end += 4
          else if (end < source.length) end += 1
        } else {
          handleControl(context, word.toLowerCase(), parameter)
        }

        index = end
        continue
      }

      if (next === "'") {
        index -= 1
        const bytes: number[] = []
        while (source[index] === '\\' && source[index + 1] === "'") {
          const hex = source.slice(index + 2, index + 4)
          const value = Number.parseInt(hex, 16)
          if (Number.isNaN(value)) break
          bytes.push(value)
          index += 4
        }
        pushText(context, decodeBytes(bytes, context.codepage))
        continue
      }

      index += 1
      switch (next) {
        case '*':
          context.state.skip = true
          break
        case '\\':
        case '{':
        case '}':
          pushText(context, next)
          break
        case '~':
          pushText(context, '\u00a0')
          break
        case '_':
          pushText(context, '\u2011')
          break
        case '-':
          break
        default:
          break
      }
      continue
    }

    if (character === '\r' || character === '\n') {
      index += 1
      continue
    }

    pushText(context, character)
    index += 1
  }

  flushParagraph(context)
  return context.paragraphs.join('')
}
