import './src/style/index.less'

export { default as FileViewer } from './src/FileViewer.vue'
export { default as FileViewerCodeBlock } from './src/renderers/CodeBlock.vue'

export {
  fileViewerRendererKinds,
  loadFileViewerRenderer,
  preloadFileViewerRenderer,
} from './src/renderers/registry'

export {
  detectFileViewerKind,
  detectFormat,
  detectMimeType,
  fileViewerFormatCatalog,
  toFileViewerMeta,
} from './src/core/detect'
export type { DetectedFormat } from './src/core/detect'

export { createFileViewerSource } from './src/core/source'
export type { CreateFileViewerSourceInput } from './src/core/source'

export {
  en,
  fileViewerLocales,
  formatFileViewerMessage,
  hasFileViewerLocale,
  normalizeFileViewerLocale,
  registerFileViewerLocale,
  resolveFileViewerMessages,
  zhCN,
} from './src/i18n'

export {
  createFileViewerTheme,
  fileViewerDarkTheme,
  fileViewerLightTheme,
  getFileViewerThemeVars,
} from './src/theme'

export type {
  DeepPartial,
  FileViewerArchiveOptions,
  FileViewerCapabilities,
  FileViewerCsvOptions,
  FileViewerEmits,
  FileViewerErrorSlotProps,
  FileViewerImageOptions,
  FileViewerInstance,
  FileViewerInstanceState,
  FileViewerKind,
  FileViewerLoadEvent,
  FileViewerMarkdownOptions,
  FileViewerMessages,
  FileViewerMessagesInput,
  FileViewerMeta,
  FileViewerOfficeOptions,
  FileViewerOptions,
  FileViewerPdfOptions,
  FileViewerProps,
  FileViewerReadyEvent,
  FileViewerRendererComponent,
  FileViewerRendererProps,
  FileViewerRendererReadyEvent,
  FileViewerResolvedTheme,
  FileViewerSource,
  FileViewerStateSlotProps,
  FileViewerStatus,
  FileViewerTextOptions,
  FileViewerTheme,
  FileViewerThemeVars,
  FileViewerToolbarSlotProps,
  FileViewerWatermarkOptions,
} from './src/types'
