import type { Component } from 'vue'
import type { FileViewerKind, FileViewerRendererComponent } from '../types'

type RendererModule = { default: Component }

const loaders: Record<FileViewerKind, () => Promise<RendererModule>> = {
  image: () => import('./ImageRenderer.vue'),
  video: () => import('./VideoRenderer.vue'),
  audio: () => import('./AudioRenderer.vue'),
  pdf: () => import('./PdfRenderer.vue'),
  document: () => import('./DocxRenderer.vue'),
  spreadsheet: () => import('./XlsxRenderer.vue'),
  presentation: () => import('./PptxRenderer.vue'),
  markdown: () => import('./MarkdownRenderer.vue'),
  text: () => import('./TextRenderer.vue'),
  code: () => import('./TextRenderer.vue'),
  json: () => import('./TextRenderer.vue'),
  xml: () => import('./TextRenderer.vue'),
  html: () => import('./HtmlRenderer.vue'),
  csv: () => import('./CsvRenderer.vue'),
  subtitle: () => import('./SubtitleRenderer.vue'),
  archive: () => import('./ArchiveRenderer.vue'),
  epub: () => import('./EpubRenderer.vue'),
  font: () => import('./FontRenderer.vue'),
  unsupported: () => import('./UnsupportedRenderer.vue'),
}

/**
 * Load the renderer for a kind. Each renderer lives in its own dynamic chunk,
 * so previewing an image never downloads the Office or PDF code.
 */
export async function loadFileViewerRenderer(
  kind: FileViewerKind,
  customRenderers?: Partial<Record<FileViewerKind, FileViewerRendererComponent>>,
): Promise<Component> {
  const custom = customRenderers?.[kind]
  if (custom) return custom
  const loader = loaders[kind] ?? loaders.unsupported
  const module = await loader()
  return module.default
}

/** Warm up a renderer chunk without mounting it. */
export function preloadFileViewerRenderer(kind: FileViewerKind): Promise<void> {
  const loader = loaders[kind]
  return loader ? loader().then(() => undefined) : Promise.resolve()
}

export const fileViewerRendererKinds = Object.keys(loaders) as FileViewerKind[]
