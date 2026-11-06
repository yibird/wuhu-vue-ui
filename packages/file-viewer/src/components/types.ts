import type {
  FileViewerCapabilities,
  FileViewerMessages,
  FileViewerMeta,
  FileViewerSource,
  FileViewerStatusBarSlotProps,
  FileViewerToolbarSlotProps,
  FileViewerWatermarkOptions,
} from '../types'

export interface ViewerToolbarProps {
  displayTitle: string
  meta: FileViewerMeta | null
  messages: FileViewerMessages['viewer']
  page: number
  pageCount: number
  pageInput: string
  zoom: number
  capabilities: FileViewerCapabilities
  isDark: boolean
  isFullscreen: boolean
  showInfo: boolean
  showThemeToggle: boolean
  showFileInfo: boolean
  allowDownload: boolean
  allowOpen: boolean
  allowPrint: boolean
  allowZoom: boolean
  allowRotate: boolean
  allowFullscreen: boolean
  hasSource: boolean
  slotProps: FileViewerToolbarSlotProps
}

export interface ViewerStatusBarProps {
  messages: FileViewerMessages['viewer']
  meta: FileViewerMeta | null
  locale: string
  capabilities: FileViewerCapabilities
  page: number
  pageCount: number
  zoom: number
  slotProps: FileViewerStatusBarSlotProps
}

export interface ViewerWatermarkProps {
  text: string
  options: FileViewerWatermarkOptions
}

export interface FileInfoPanelProps {
  meta: FileViewerMeta
  source: FileViewerSource | null
  messages: FileViewerMessages['viewer']
  locale: string
}
