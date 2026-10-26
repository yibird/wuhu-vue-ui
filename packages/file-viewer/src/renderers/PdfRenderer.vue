<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { isSafeExternalUrl } from '../core/download'
import { printUrl } from '../core/print'
import { toRendererError } from '../core/errors'
import type { FileViewerRendererProps } from '../types'

defineOptions({
  name: 'WFileViewerPdfRenderer',
})

const props = defineProps<FileViewerRendererProps>()

/**
 * Minimal structural types for the optional pdf.js peer. Only the APIs the
 * renderer actually calls are described, so the component does not depend on
 * pdfjs-dist's TypeScript declarations being installed.
 */
interface PdfRenderTask {
  promise: Promise<unknown>
  cancel?: () => void
}

interface PdfViewport {
  width: number
  height: number
  transform: number[]
}

interface PdfTextItem {
  str?: string
  transform?: number[]
  fontName?: string
}

interface PdfTextContent {
  items: PdfTextItem[]
  styles?: Record<string, { fontFamily?: string }>
}

interface PdfPage {
  rotate: number
  getViewport(options: { scale: number; rotation?: number }): PdfViewport
  render(options: {
    canvasContext: CanvasRenderingContext2D
    viewport: PdfViewport
    transform?: number[]
  }): PdfRenderTask
  getTextContent(): Promise<PdfTextContent>
}

interface PdfDocument {
  numPages: number
  getPage(pageNumber: number): Promise<PdfPage>
  destroy?: () => Promise<void> | void
}

interface PdfjsModule {
  getDocument(options: Record<string, unknown>): { promise: Promise<PdfDocument> }
  GlobalWorkerOptions?: { workerSrc?: string }
  Util?: { transform?: (m1: number[], m2: number[]) => number[] }
}

function isPdfjsModule(value: unknown): value is PdfjsModule {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { getDocument?: unknown }).getDocument === 'function'
  )
}

const emit = defineEmits<{
  ready: [
    payload: {
      pageCount: number
      capabilities: { zoom: boolean; rotate: boolean; paged: boolean; print: boolean }
    },
  ]
  error: [error: Error]
}>()

const canvasRef = ref<HTMLCanvasElement>()
const textLayerRef = ref<HTMLDivElement>()
const pdfDocument = shallowRef<PdfDocument | undefined>()
const pdfjsModule = shallowRef<PdfjsModule | undefined>()
const pageCount = ref(0)
const nativeMode = ref(false)
const nativeSourceUrl = computed(() =>
  isSafeExternalUrl(props.source.url) ? props.source.url : '',
)
const loading = ref(true)
const passwordRequired = ref(false)
const password = ref('')
const passwordIncorrect = ref(false)
const renderError = ref('')
const pageWidth = ref(0)
const pageHeight = ref(0)
let bytes: Uint8Array | undefined
let renderTask: PdfRenderTask | undefined
let renderToken = 0
let destroyed = false
let readyEmitted = false

const pageLabel = computed(() =>
  props.messages.renderers.pdf.pageLabel
    .replace('{page}', String(Math.min(Math.max(1, props.page), Math.max(1, pageCount.value))))
    .replace('{total}', String(pageCount.value)),
)

async function resolvePdfjs(): Promise<PdfjsModule | null> {
  const provided = props.options.pdf?.pdfjs
  if (isPdfjsModule(provided)) return provided

  const globalCandidate = (globalThis as Record<string, unknown>).pdfjsLib
  if (isPdfjsModule(globalCandidate)) return globalCandidate

  try {
    // A static specifier lets Vite/Rollup resolve the optional peer. The
    // package build externalizes it so consumers without pdfjs-dist still
    // fall back to the native browser viewer at runtime.
    const module = await import('pdfjs-dist')
    const resolved: unknown = (module as Record<string, unknown>).default ?? module
    if (isPdfjsModule(resolved)) return resolved
  } catch {
    return null
  }
  return null
}

function emitReady(
  pageTotal: number,
  capabilities: {
    zoom: boolean
    rotate: boolean
    paged: boolean
    print: boolean
  },
): void {
  readyEmitted = true
  emit('ready', { pageCount: pageTotal, capabilities })
}

async function load(): Promise<void> {
  loading.value = true
  renderError.value = ''
  try {
    bytes ??= new Uint8Array(await props.source.getArrayBuffer())
    const module = await resolvePdfjs()
    if (destroyed) return

    if (!module) {
      nativeMode.value = true
      loading.value = false
      emitReady(0, { zoom: false, rotate: false, paged: false, print: true })
      return
    }

    pdfjsModule.value = module
    if (props.options.pdf?.workerSrc) {
      module.GlobalWorkerOptions ??= {}
      module.GlobalWorkerOptions.workerSrc = props.options.pdf.workerSrc
    }

    const hadPassword = Boolean(password.value)
    const loadingTask = module.getDocument({
      ...props.options.pdf?.documentOptions,
      data: bytes.slice(0),
      ...(hadPassword ? { password: password.value } : {}),
    })
    const document = await loadingTask.promise
    if (destroyed) {
      await document.destroy?.()
      return
    }

    pdfDocument.value = document
    pageCount.value = document.numPages
    passwordRequired.value = false
    passwordIncorrect.value = false
    loading.value = false
    nativeMode.value = false
    emitReady(document.numPages, { zoom: true, rotate: true, paged: true, print: true })
    await nextTick()
    await renderPage()
  } catch (cause) {
    if (destroyed) return
    const name =
      cause && typeof cause === 'object' && 'name' in cause
        ? String((cause as { name: unknown }).name)
        : ''
    if (name.includes('Password')) {
      passwordRequired.value = true
      passwordIncorrect.value = Boolean(password.value)
      loading.value = false
      if (!readyEmitted) {
        emitReady(0, { zoom: false, rotate: false, paged: false, print: false })
      }
      return
    }
    loading.value = false
    emit('error', toRendererError(props.messages.renderers.pdf.renderError, cause))
  }
}

function multiply(m1: number[], m2: number[]): number[] {
  return [
    m1[0]! * m2[0]! + m1[2]! * m2[1]!,
    m1[1]! * m2[0]! + m1[3]! * m2[1]!,
    m1[0]! * m2[2]! + m1[2]! * m2[3]!,
    m1[1]! * m2[2]! + m1[3]! * m2[3]!,
    m1[0]! * m2[4]! + m1[2]! * m2[5]! + m1[4]!,
    m1[1]! * m2[4]! + m1[3]! * m2[5]! + m1[5]!,
  ]
}

async function renderTextLayer(
  page: PdfPage,
  viewport: PdfViewport,
  module: PdfjsModule,
): Promise<void> {
  const container = textLayerRef.value
  if (!container) return
  const content = await page.getTextContent()
  if (destroyed) return

  container.innerHTML = ''
  container.style.width = `${viewport.width}px`
  container.style.height = `${viewport.height}px`
  const fragment = document.createDocumentFragment()

  for (const item of content.items) {
    if (!item.str) continue
    const transform = Array.isArray(item.transform) ? item.transform : [1, 0, 0, 1, 0, 0]
    const matrix =
      module.Util?.transform && Array.isArray(viewport.transform)
        ? module.Util.transform(viewport.transform, transform)
        : multiply(viewport.transform, transform)
    const fontHeight = Math.hypot(matrix[2] ?? 0, matrix[3] ?? 0) || 12
    const angle = Math.atan2(matrix[1] ?? 0, matrix[0] ?? 0)
    const span = document.createElement('span')
    span.textContent = item.str
    span.style.left = `${matrix[4] ?? 0}px`
    span.style.top = `${(matrix[5] ?? 0) - fontHeight}px`
    span.style.fontSize = `${fontHeight}px`
    span.style.fontFamily = content.styles?.[item.fontName ?? '']?.fontFamily ?? 'sans-serif'
    span.style.transformOrigin = '0 0'
    if (angle) span.style.transform = `rotate(${angle}rad)`
    fragment.appendChild(span)
  }

  container.appendChild(fragment)
}

async function renderPage(): Promise<void> {
  const document = pdfDocument.value
  if (!document || nativeMode.value || passwordRequired.value) return
  const token = ++renderToken
  renderError.value = ''

  try {
    renderTask?.cancel?.()
    const pageNumber = Math.min(Math.max(1, props.page), pageCount.value)
    const page = await document.getPage(pageNumber)
    if (token !== renderToken || destroyed) return

    const module = pdfjsModule.value
    const scale = props.zoom * 1.5
    const viewport = page.getViewport({
      scale,
      rotation: (page.rotate + props.rotation) % 360,
    })
    const canvas = canvasRef.value
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas 2D is not available.')

    const ratio = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)
    canvas.width = Math.max(1, Math.floor(viewport.width * ratio))
    canvas.height = Math.max(1, Math.floor(viewport.height * ratio))
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`
    pageWidth.value = viewport.width
    pageHeight.value = viewport.height

    renderTask = page.render({
      canvasContext: context,
      viewport,
      transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
    })
    await renderTask.promise
    if (token !== renderToken || destroyed) return

    if (module && props.options.pdf?.textLayer !== false) {
      await renderTextLayer(page, viewport, module)
    }
  } catch (cause) {
    const name =
      cause && typeof cause === 'object' && 'name' in cause
        ? String((cause as { name: unknown }).name)
        : ''
    if (name.includes('Cancelled') || token !== renderToken || destroyed) return
    renderError.value =
      cause instanceof Error ? cause.message : props.messages.renderers.pdf.renderError
  }
}

function submitPassword(): void {
  passwordIncorrect.value = false
  void load()
}

function print(): boolean {
  return isSafeExternalUrl(props.source.url) ? printUrl(props.source.url) : false
}

defineExpose({ print })

watch(
  () => [props.page, props.zoom, props.rotation] as const,
  () => {
    if (pdfDocument.value) void renderPage()
  },
)

onMounted(load)
onBeforeUnmount(() => {
  destroyed = true
  renderTask?.cancel?.()
  const document = pdfDocument.value
  pdfDocument.value = undefined
  void document?.destroy?.()
})
</script>

<template>
  <div class="w-file-viewer__pdf">
    <div v-if="passwordRequired" class="w-file-viewer__pdf-password">
      <div class="w-file-viewer__pdf-password-card">
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <rect
            x="10"
            y="21"
            width="28"
            height="20"
            rx="3"
            stroke="currentColor"
            stroke-width="2"
          />
          <path
            d="M17 21v-5a7 7 0 0 1 14 0v5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <h3>{{ messages.renderers.pdf.password }}</h3>
        <form @submit.prevent="submitPassword">
          <input
            v-model="password"
            type="password"
            class="w-file-viewer__field"
            :placeholder="messages.renderers.pdf.passwordPlaceholder"
            :aria-label="messages.renderers.pdf.passwordPlaceholder"
            autocomplete="off"
          />
          <button type="submit" class="w-file-viewer__button is-primary">
            {{ messages.renderers.pdf.passwordSubmit }}
          </button>
        </form>
        <p v-if="passwordIncorrect" class="w-file-viewer__inline-error">
          {{ messages.renderers.pdf.passwordIncorrect }}
        </p>
      </div>
    </div>

    <template v-else-if="nativeMode">
      <div v-if="nativeSourceUrl" class="w-file-viewer__pdf-native">
        <p class="w-file-viewer__isolation-note">
          {{ messages.renderers.pdf.nativeNotice }} {{ messages.renderers.pdf.installHint }}
        </p>
        <iframe class="w-file-viewer__pdf-frame" :src="nativeSourceUrl" :title="source.name" />
      </div>
      <div v-else class="w-file-viewer__pdf-error">
        <span>{{ messages.renderers.pdf.nativeUnavailable }}</span>
      </div>
    </template>

    <template v-else>
      <div class="w-file-viewer__pdf-viewport">
        <div
          class="w-file-viewer__pdf-page"
          :style="{ width: `${pageWidth}px`, minHeight: `${pageHeight}px` }"
        >
          <canvas ref="canvasRef" />
          <div ref="textLayerRef" class="w-file-viewer__pdf-text-layer" />
          <div v-if="loading" class="w-file-viewer__pdf-loading">
            {{ messages.viewer.loading }}
          </div>
        </div>
      </div>
      <div v-if="renderError" class="w-file-viewer__pdf-error">
        <span>{{ messages.renderers.pdf.renderError }} {{ renderError }}</span>
        <button type="button" class="w-file-viewer__link-button" @click="renderPage">
          {{ messages.viewer.retry }}
        </button>
      </div>
      <div v-if="pageCount > 1" class="w-file-viewer__pdf-page-label">{{ pageLabel }}</div>
    </template>
  </div>
</template>
