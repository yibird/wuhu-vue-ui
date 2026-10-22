import type { FileViewerCapabilities, FileViewerKind } from '../types'

/** Capabilities implied by a file kind before a renderer reports overrides. */
export function defaultCapabilities(kind: FileViewerKind | undefined): FileViewerCapabilities {
  switch (kind) {
    case 'image':
    case 'pdf':
      return { zoom: true, rotate: true, paged: kind === 'pdf', print: true }
    case 'document':
    case 'presentation':
    case 'spreadsheet':
      return { zoom: true, rotate: false, paged: true, print: true }
    case 'epub':
      return { zoom: false, rotate: false, paged: true, print: true }
    case 'markdown':
    case 'text':
    case 'code':
    case 'json':
    case 'xml':
    case 'csv':
    case 'subtitle':
    case 'font':
    case 'video':
      return { zoom: false, rotate: false, paged: false, print: true }
    case 'audio':
    case 'html':
    case 'archive':
    case 'unsupported':
    default:
      return { zoom: false, rotate: false, paged: false, print: false }
  }
}
