import type { Component, CSSProperties } from 'vue'

/**
 * Renderer kinds supported by the file viewer. Every kind is loaded on demand
 * the first time a matching file is previewed.
 */
export type FileViewerKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'markdown'
  | 'text'
  | 'code'
  | 'json'
  | 'xml'
  | 'html'
  | 'csv'
  | 'subtitle'
  | 'archive'
  | 'epub'
  | 'font'
  | 'unsupported'

export type FileViewerTheme = 'light' | 'dark' | 'auto'
export type FileViewerResolvedTheme = 'light' | 'dark'

export interface FileViewerSource {
  /** File name used for format detection and display. */
  readonly name: string
  /** Resolved MIME type. */
  readonly mime: string
  /** Lower-case extension without a leading dot. */
  readonly extension: string
  /** File size in bytes when known. */
  readonly size?: number
  /** Detected renderer kind. */
  readonly kind: FileViewerKind
  /** A playable / downloadable URL (object URL for local blobs). */
  readonly url: string
  /** Source blob when one was provided. */
  readonly file?: File
  /** Last modification timestamp when available. */
  readonly lastModified?: number
  /** Whether {@link url} was created by the viewer and must be revoked. */
  readonly isObjectUrl: boolean
  getBlob(): Promise<Blob>
  getArrayBuffer(): Promise<ArrayBuffer>
  getText(): Promise<string>
  dispose(): void
}

export interface FileViewerCapabilities {
  zoom: boolean
  rotate: boolean
  paged: boolean
  print: boolean
}

export interface FileViewerMeta {
  name: string
  extension: string
  mime: string
  size?: number
  kind: FileViewerKind
  label: string
  supported: boolean
}

export interface FileViewerPdfOptions {
  /**
   * A loaded pdf.js module (`import * as pdfjsLib from 'pdfjs-dist'`).
   * When omitted the viewer also looks for `globalThis.pdfjsLib` and finally
   * tries to `import('pdfjs-dist')`. If no module is available the native
   * browser PDF viewer is used instead.
   */
  pdfjs?: unknown
  /** Worker URL forwarded to `pdfjsLib.GlobalWorkerOptions.workerSrc`. */
  workerSrc?: string
  /** Render a selectable text layer. Defaults to true. */
  textLayer?: boolean
  /** Extra options forwarded to `pdfjsLib.getDocument`. */
  documentOptions?: Record<string, unknown>
}

export interface FileViewerOfficeOptions {
  /** Paper used for generated document pages. Defaults to `a4`. */
  pageSize?: 'a4' | 'letter'
  /** Safety cap for generated pages / slides / sheets. Defaults to 300. */
  maxPages?: number
  /** Safety cap for spreadsheet rows. Defaults to 5000. */
  maxRows?: number
  /** Safety cap for spreadsheet columns. Defaults to 200. */
  maxColumns?: number
  /** Show spreadsheet grid lines. Defaults to true. */
  showGrid?: boolean
  /** Show spreadsheet sheet tabs. Defaults to true. */
  showSheetTabs?: boolean
}

export interface FileViewerTextOptions {
  /** Show line numbers for code and JSON. Defaults to true. */
  lineNumbers?: boolean
  /** Wrap long lines. Defaults to false for code, true for plain text. */
  wrap?: boolean
  /** Maximum decoded bytes. Defaults to 4 MiB. */
  maxBytes?: number
}

export interface FileViewerMarkdownOptions {
  /** Base URL used to resolve relative links and images. */
  baseUrl?: string
}

export interface FileViewerCsvOptions {
  /** Force a delimiter. Auto-detected when omitted. */
  delimiter?: string
  /** Maximum parsed rows. Defaults to 5000. */
  maxRows?: number
  /** Maximum rendered columns per row. Defaults to 200. */
  maxColumns?: number
  /** Maximum decoded bytes. Defaults to 8 MiB. */
  maxBytes?: number
}

export interface FileViewerImageOptions {
  /** Canvas background. Defaults to `checkerboard` for transparent images. */
  background?: 'solid' | 'checkerboard' | 'transparent'
  /** Initial sizing. Defaults to `contain`. */
  fit?: 'contain' | 'actual'
}

export interface FileViewerVideoOptions {
  /** Poster URL displayed before the video starts. */
  poster?: string
}

export interface FileViewerArchiveOptions {
  /** Maximum number of listed entries. Defaults to 2000. */
  maxEntries?: number
  /** Maximum entry size that can be previewed. Defaults to 1 MiB. */
  maxPreviewBytes?: number
}

export interface FileViewerWatermarkOptions {
  opacity?: number
  fontSize?: number
  color?: string
  rotate?: number
}

export interface FileViewerOptions {
  pdf?: FileViewerPdfOptions
  office?: FileViewerOfficeOptions
  text?: FileViewerTextOptions
  markdown?: FileViewerMarkdownOptions
  csv?: FileViewerCsvOptions
  image?: FileViewerImageOptions
  video?: FileViewerVideoOptions
  archive?: FileViewerArchiveOptions
}

export interface FileViewerRendererReadyEvent {
  pageCount: number
  page?: number
  capabilities?: Partial<FileViewerCapabilities>
}

export interface FileViewerRendererProps {
  source: FileViewerSource
  kind: FileViewerKind
  options: FileViewerOptions
  locale: string
  messages: FileViewerMessages
  theme: FileViewerResolvedTheme
  zoom: number
  rotation: number
  page: number
}

export type FileViewerRendererComponent = Component

export interface FileViewerLoadEvent {
  source: FileViewerSource
  meta: FileViewerMeta
}

export interface FileViewerReadyEvent extends FileViewerLoadEvent {
  pageCount: number
  capabilities: FileViewerCapabilities
}

export interface FileViewerToolbarSlotProps {
  source: FileViewerSource | null
  meta: FileViewerMeta | null
  page: number
  pageCount: number
  zoom: number
  rotation: number
  theme: FileViewerResolvedTheme
  loading: boolean
  capabilities: FileViewerCapabilities
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  rotateLeft: () => void
  rotateRight: () => void
  previousPage: () => void
  nextPage: () => void
  goToPage: (page: number) => void
  download: () => void
  print: () => void
  toggleFullscreen: () => void
  toggleTheme: () => void
}

export interface FileViewerErrorSlotProps {
  error: Error
  retry: () => void
}

export interface FileViewerStatusBarSlotProps {
  source: FileViewerSource | null
  meta: FileViewerMeta | null
  page: number
  pageCount: number
  zoom: number
}

export interface FileViewerStateSlotProps {
  source: FileViewerSource | null
  meta: FileViewerMeta | null
}

export type FileViewerStatus = 'empty' | 'loading' | 'ready' | 'error'

export interface FileViewerInstanceState {
  source: FileViewerSource | null
  meta: FileViewerMeta | null
  status: FileViewerStatus
  page: number
  pageCount: number
  zoom: number
  rotation: number
  theme: FileViewerResolvedTheme
  capabilities: FileViewerCapabilities
}

/** Methods exposed through a template ref. */
export interface FileViewerInstance {
  reload: () => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  rotateLeft: () => void
  rotateRight: () => void
  previousPage: () => void
  nextPage: () => void
  goToPage: (page: number) => void
  download: () => Promise<void>
  print: () => void
  open: () => void
  toggleFullscreen: () => Promise<void>
  toggleTheme: () => void
  setTheme: (theme: FileViewerResolvedTheme) => void
  getState: () => FileViewerInstanceState
}

export interface FileViewerProps {
  /** Remote URL or data URL of the file. */
  src?: string
  /** Local file or blob. Takes precedence over `src` when both are set. */
  file?: File | Blob | null
  /** Override the display / detection name. */
  name?: string
  /** Override the detected MIME type. */
  type?: string
  /** Override the reported size in bytes. */
  size?: number
  /** Per-renderer tuning. */
  options?: FileViewerOptions
  /** UI locale. Built in: `en` (default) and `zh-CN`. */
  locale?: string
  /** Deep partial overrides merged on top of the locale messages. */
  messages?: FileViewerMessagesInput
  /** Toolbar title. Defaults to the file name. */
  title?: string
  /** CSS width. Defaults to 100%. */
  width?: string | number
  /** CSS height. Defaults to 600px. */
  height?: string | number
  /**
   * Light, dark, or `auto`. `auto` is resolved once from `data-w-theme` /
   * `prefers-color-scheme` when initialized or when the prop is reapplied; no
   * theme listeners are registered.
   */
  theme?: FileViewerTheme
  /** Custom CSS variable overrides, e.g. `{ '--w-file-viewer-primary': '#16a34a' }`. */
  themeVars?: Record<string, string>
  /** Show the theme toggle button. Defaults to true. */
  showThemeToggle?: boolean
  /** Show the toolbar. Defaults to true. */
  showToolbar?: boolean
  /** Show the bottom status bar. Defaults to true. */
  showStatusBar?: boolean
  /** Show the file info button. Defaults to true. */
  showFileInfo?: boolean
  /** Allow downloading. Defaults to true. */
  allowDownload?: boolean
  /** Allow printing. Defaults to true. */
  allowPrint?: boolean
  /** Allow opening the file in a new tab. Defaults to true. */
  allowOpen?: boolean
  /** Allow entering fullscreen. Defaults to true. */
  allowFullscreen?: boolean
  /** Allow zooming (when the renderer supports it). Defaults to true. */
  allowZoom?: boolean
  /** Allow rotating (when the renderer supports it). Defaults to true. */
  allowRotate?: boolean
  /** Watermark text rendered above the preview. */
  watermark?: string
  watermarkOptions?: FileViewerWatermarkOptions
  /** Controlled current page. */
  page?: number
  /** Initial page when `page` is not controlled. Defaults to 1. */
  initialPage?: number
  /** Controlled zoom (1 = 100%). */
  zoom?: number
  /** Initial zoom when `zoom` is not controlled. Defaults to 1. */
  initialZoom?: number
  /** Controlled rotation in degrees. */
  rotation?: number
  /** Initial rotation when `rotation` is not controlled. Defaults to 0. */
  initialRotation?: number
  minZoom?: number
  maxZoom?: number
  zoomStep?: number
  /** Extra / overriding renderers keyed by kind. */
  renderers?: Partial<Record<FileViewerKind, FileViewerRendererComponent>>
  /** Enable keyboard shortcuts. Defaults to true. */
  keyboard?: boolean
  /** Zoom with Ctrl/Cmd + wheel. Defaults to true. */
  wheelZoom?: boolean
  /** Accessible label for the viewer region. */
  ariaLabel?: string
}

export interface FileViewerEmits {
  load: [event: FileViewerLoadEvent]
  ready: [event: FileViewerReadyEvent]
  error: [error: Error]
  'update:page': [page: number]
  'update:zoom': [zoom: number]
  'update:rotation': [rotation: number]
  'update:theme': [theme: FileViewerResolvedTheme]
  'fullscreen-change': [fullscreen: boolean]
  download: [source: FileViewerSource]
  print: [source: FileViewerSource]
  open: [source: FileViewerSource]
  'file-drop': [file: File]
}

export interface FileViewerMessages {
  viewer: {
    untitled: string
    loading: string
    parsing: string
    empty: string
    emptyHint: string
    errorTitle: string
    errorDescription: string
    retry: string
    download: string
    print: string
    openInNewTab: string
    fileInfo: string
    close: string
    name: string
    type: string
    size: string
    lastModified: string
    format: string
    unknown: string
    page: string
    pageOf: string
    pageInput: string
    zoomIn: string
    zoomOut: string
    resetZoom: string
    rotateLeft: string
    rotateRight: string
    previousPage: string
    nextPage: string
    fullscreen: string
    exitFullscreen: string
    switchToDark: string
    switchToLight: string
    downloadStarted: string
    downloadFallback: string
    downloadFailed: string
    printBlocked: string
    openBlocked: string
    truncated: string
    truncatedHint: string
    loadFull: string
    dropHint: string
  }
  renderers: {
    pdf: {
      renderError: string
      nativeNotice: string
      installHint: string
      password: string
      passwordIncorrect: string
      nativeUnavailable: string
      passwordPlaceholder: string
      passwordSubmit: string
      pageLabel: string
    }
    docx: {
      parseError: string
      empty: string
    }
    xlsx: {
      parseError: string
      empty: string
      rows: string
    }
    pptx: {
      parseError: string
      empty: string
    }
    markdown: {
      copy: string
      copied: string
      viewSource: string
      viewPreview: string
      parseError: string
    }
    code: {
      copy: string
      copied: string
      wrap: string
      lineNumbers: string
      empty: string
      readError: string
      lineLimit: string
    }
    json: {
      formatError: string
    }
    csv: {
      empty: string
      rows: string
      loadMore: string
      readError: string
    }
    html: {
      preview: string
      source: string
      copy: string
      copied: string
      isolated: string
      readError: string
    }
    archive: {
      parseError: string
      empty: string
      entries: string
      folder: string
      preview: string
      downloadEntry: string
      tooLarge: string
      binary: string
      unsupported: string
      truncated: string
    }
    epub: {
      parseError: string
      chapter: string
      contents: string
      empty: string
      untitled: string
    }
    font: {
      loadError: string
      sample: string
    }
    subtitle: {
      empty: string
      parseError: string
    }
    image: {
      loadError: string
    }
    video: {
      loadError: string
    }
    audio: {
      loadError: string
    }
    unsupported: {
      title: string
      description: string
      hint: string
    }
  }
}

type Primitive =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | ((...args: never[]) => unknown)

export type DeepPartial<T> = T extends Primitive
  ? T
  : T extends readonly (infer U)[]
    ? readonly DeepPartial<U>[]
    : { [K in keyof T]?: DeepPartial<T[K]> }

export type FileViewerMessagesInput = DeepPartial<FileViewerMessages>

export type FileViewerThemeVars = CSSProperties &
  Record<`--w-file-viewer-${string}`, string | number>
