<script setup lang="ts">
import {
  computed,
  markRaw,
  onBeforeUnmount,
  onErrorCaptured,
  onMounted,
  ref,
  shallowRef,
  watch,
  type CSSProperties,
  type ComponentPublicInstance,
} from 'vue'
import { useMediaQuery, useTimeoutFn } from '@wuhu-ui/core'
import Icon from './components/Icon.vue'
import { defaultCapabilities } from './core/capabilities'
import { detectFormat } from './core/detect'
import { openInNewTab, triggerDownload } from './core/download'
import { clamp, formatBytes, formatDateTime, toCssSize, toError } from './core/format'
import { printUrl } from './core/print'
import { createFileViewerSource } from './core/source'
import { resolveFileViewerMessages } from './i18n'
import { loadFileViewerRenderer } from './renderers/registry'
import type {
  FileViewerCapabilities,
  FileViewerEmits,
  FileViewerErrorSlotProps,
  FileViewerMeta,
  FileViewerProps,
  FileViewerReadyEvent,
  FileViewerRendererComponent,
  FileViewerRendererReadyEvent,
  FileViewerResolvedTheme,
  FileViewerSource,
  FileViewerStateSlotProps,
  FileViewerToolbarSlotProps,
} from './types'

defineOptions({
  name: 'WFileViewer',
})

const props = withDefaults(defineProps<FileViewerProps>(), {
  src: '',
  file: null,
  name: '',
  type: '',
  options: () => ({}),
  locale: 'en',
  messages: () => ({}),
  title: '',
  width: '100%',
  height: '600px',
  theme: 'auto',
  themeVars: () => ({}),
  showThemeToggle: true,
  showToolbar: true,
  showStatusBar: true,
  showFileInfo: true,
  allowDownload: true,
  allowPrint: true,
  allowOpen: true,
  allowFullscreen: true,
  allowZoom: true,
  allowRotate: true,
  watermark: '',
  watermarkOptions: () => ({}),
  initialPage: 1,
  initialZoom: 1,
  initialRotation: 0,
  minZoom: 0.25,
  maxZoom: 4,
  zoomStep: 0.25,
  renderers: () => ({}),
  keyboard: true,
  wheelZoom: true,
  ariaLabel: '',
})

const emit = defineEmits<FileViewerEmits>()

defineSlots<{
  toolbar?: (props: FileViewerToolbarSlotProps) => unknown
  'toolbar-left'?: (props: FileViewerToolbarSlotProps) => unknown
  'toolbar-actions'?: (props: FileViewerToolbarSlotProps) => unknown
  loading?: (props: FileViewerStateSlotProps) => unknown
  empty?: (props: FileViewerStateSlotProps) => unknown
  error?: (props: FileViewerErrorSlotProps) => unknown
  watermark?: (props: { text: string }) => unknown
  'status-bar'?: (props: {
    source: FileViewerSource | null
    meta: FileViewerMeta | null
    page: number
    pageCount: number
    zoom: number
  }) => unknown
}>()

const rootRef = ref<HTMLElement>()
const rendererRef = ref<ComponentPublicInstance & { print?: () => boolean | void }>()
const source = shallowRef<FileViewerSource | null>(null)
const rendererComponent = shallowRef<FileViewerRendererComponent | null>(null)
const rendererKey = ref(0)
const status = ref<'empty' | 'loading' | 'ready' | 'error'>('empty')
const error = ref<Error | null>(null)
const page = ref(1)
const pageInput = ref('1')
const pageCount = ref(0)
const zoom = ref(1)
const rotation = ref(0)
const showInfo = ref(false)
const isFullscreen = ref(false)
const pseudoFullscreen = ref(false)
const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
const themeOverride = ref<FileViewerResolvedTheme | null>(null)
const notice = ref<{ text: string; error: boolean } | null>(null)
const noticeTimeout = useTimeoutFn(() => {
  notice.value = null
}, 3200)
const isDraggingFile = ref(false)
const remoteSize = ref<number | undefined>()
const capabilities = ref<FileViewerCapabilities>({
  zoom: false,
  rotate: false,
  paged: false,
  print: false,
})

let loadToken = 0
let sizeToken = 0
let dragDepth = 0

const messages = computed(() => resolveFileViewerMessages(props.locale, props.messages))
const resolvedTheme = computed<FileViewerResolvedTheme>(() => {
  if (themeOverride.value) return themeOverride.value
  if (props.theme === 'light' || props.theme === 'dark') return props.theme
  return systemDark.value ? 'dark' : 'light'
})

const meta = computed<FileViewerMeta | null>(() => {
  const current = source.value
  if (!current) return null
  const detected = detectFormat(current.name, current.mime)
  return {
    name: current.name,
    extension: current.extension,
    mime: current.mime,
    size: current.size ?? remoteSize.value,
    kind: current.kind,
    label: detected.label,
    supported: detected.supported,
  }
})

const displayTitle = computed(
  () => props.title || meta.value?.name || messages.value.viewer.untitled,
)
const zoomPercent = computed(() => `${Math.round(zoom.value * 100)}%`)
const isDark = computed(() => resolvedTheme.value === 'dark')
const rootClass = computed(() => ({
  'w-file-viewer': true,
  'is-dark': isDark.value,
  'is-light': !isDark.value,
  'is-fullscreen': isFullscreen.value,
  'is-pseudo-fullscreen': pseudoFullscreen.value,
  'has-toolbar': props.showToolbar,
}))
const rootStyle = computed(
  () =>
    ({
      width: toCssSize(props.width),
      height: toCssSize(props.height),
      ...props.themeVars,
    }) as CSSProperties,
)
const watermarkStyle = computed(() => {
  const options = props.watermarkOptions
  const style: Record<string, string> = {
    '--w-file-viewer-watermark-opacity': String(options.opacity ?? 0.12),
    '--w-file-viewer-watermark-size': `${options.fontSize ?? 22}px`,
    '--w-file-viewer-watermark-rotate': `${options.rotate ?? -24}deg`,
  }
  if (options.color) style['--w-file-viewer-watermark-color'] = options.color
  return style as CSSProperties
})
const showLoading = computed(() => status.value === 'loading')
const hasPageControls = computed(() => capabilities.value.paged && pageCount.value > 1)

const toolbarSlotProps = computed<FileViewerToolbarSlotProps>(() => ({
  source: source.value,
  meta: meta.value,
  page: page.value,
  pageCount: pageCount.value,
  zoom: zoom.value,
  rotation: rotation.value,
  theme: resolvedTheme.value,
  loading: showLoading.value,
  capabilities: capabilities.value,
  zoomIn,
  zoomOut,
  resetZoom,
  rotateLeft,
  rotateRight,
  previousPage,
  nextPage,
  goToPage,
  download,
  print,
  toggleFullscreen,
  toggleTheme,
}))

const stateSlotProps = computed<FileViewerStateSlotProps>(() => ({
  source: source.value,
  meta: meta.value,
}))

function showNotice(text: string, isError = false): void {
  notice.value = { text, error: isError }
  noticeTimeout.stop()
  noticeTimeout.start()
}

async function probeRemoteSize(current: FileViewerSource): Promise<void> {
  if (current.size !== undefined || current.file) return
  if (!/^https?:\/\//i.test(current.url) || typeof fetch !== 'function') return

  const token = sizeToken
  try {
    const response = await fetch(current.url, { method: 'HEAD' })
    if (token !== sizeToken || !response.ok) return
    const header = response.headers.get('content-length')
    const value = header === null ? Number.NaN : Number.parseInt(header, 10)
    if (Number.isFinite(value) && value >= 0) remoteSize.value = value
  } catch {
    // Size is optional: HEAD may be blocked by CORS or the server.
  }
}

function hasFilePayload(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files')
}

function handleDragEnter(event: DragEvent): void {
  if (!hasFilePayload(event)) return
  event.preventDefault()
  dragDepth += 1
  isDraggingFile.value = true
}

function handleDragOver(event: DragEvent): void {
  if (!hasFilePayload(event)) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  isDraggingFile.value = true
}

function handleDragLeave(): void {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) isDraggingFile.value = false
}

function handleDrop(event: DragEvent): void {
  event.preventDefault()
  dragDepth = 0
  isDraggingFile.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) emit('file-drop', file)
}

function syncPageInput(): void {
  pageInput.value = String(page.value)
}

function applyPage(next: number, notify: boolean): void {
  const maximum = pageCount.value > 0 ? pageCount.value : Math.max(1, next)
  const value = clamp(Math.round(next) || 1, 1, maximum)
  if (value === page.value) return
  page.value = value
  syncPageInput()
  if (notify) emit('update:page', value)
}

function goToPage(next: number): void {
  if (!capabilities.value.paged) return
  applyPage(next, true)
}

function previousPage(): void {
  goToPage(page.value - 1)
}

function nextPage(): void {
  goToPage(page.value + 1)
}

function commitPageInput(): void {
  const parsed = Number.parseInt(pageInput.value, 10)
  if (Number.isFinite(parsed)) goToPage(parsed)
  else syncPageInput()
}

function setZoom(next: number, notify = true): void {
  const value = clamp(Math.round(next * 100) / 100, props.minZoom, props.maxZoom)
  if (value === zoom.value) return
  zoom.value = value
  if (notify) emit('update:zoom', value)
}

function zoomIn(): void {
  if (!capabilities.value.zoom) return
  setZoom(zoom.value + props.zoomStep)
}

function zoomOut(): void {
  if (!capabilities.value.zoom) return
  setZoom(zoom.value - props.zoomStep)
}

function resetZoom(): void {
  if (!capabilities.value.zoom) return
  setZoom(1)
}

function normalizeRotation(value: number): number {
  return ((value % 360) + 360) % 360
}

function setRotation(next: number, notify = true): void {
  const value = normalizeRotation(next)
  if (value === rotation.value) return
  rotation.value = value
  if (notify) emit('update:rotation', value)
}

function rotateLeft(): void {
  if (!capabilities.value.rotate) return
  setRotation(rotation.value - 90)
}

function rotateRight(): void {
  if (!capabilities.value.rotate) return
  setRotation(rotation.value + 90)
}

function toggleTheme(): void {
  const next: FileViewerResolvedTheme = isDark.value ? 'light' : 'dark'
  themeOverride.value = next
  emit('update:theme', next)
}

function applyRendererReady(payload: FileViewerRendererReadyEvent): void {
  status.value = 'ready'
  pageCount.value = Math.max(0, payload.pageCount || 0)
  capabilities.value = {
    ...capabilities.value,
    ...payload.capabilities,
  }
  if (pageCount.value > 0) applyPage(Math.min(page.value, pageCount.value), false)
  else {
    page.value = 1
    syncPageInput()
  }
  const current = source.value
  const currentMeta = meta.value
  if (current && currentMeta) {
    const event: FileViewerReadyEvent = {
      source: current,
      meta: currentMeta,
      pageCount: pageCount.value,
      capabilities: capabilities.value,
    }
    emit('ready', event)
  }
}

function handleRendererError(cause: unknown): void {
  const normalized = toError(cause)
  status.value = 'error'
  error.value = normalized
  emit('error', normalized)
}

function handleRendererPageChange(next: number): void {
  applyPage(next, true)
}

async function loadRenderer(current: FileViewerSource): Promise<void> {
  const token = ++loadToken
  try {
    const component = await loadFileViewerRenderer(current.kind, props.renderers)
    if (token !== loadToken) return
    rendererComponent.value = markRaw(component)
    rendererKey.value += 1
  } catch (cause) {
    if (token !== loadToken) return
    handleRendererError(cause)
  }
}

function rebuildSource(): void {
  loadToken += 1
  sizeToken += 1
  remoteSize.value = undefined
  rendererComponent.value = null
  error.value = null
  status.value = 'loading'
  pageCount.value = 0
  showInfo.value = false
  rendererKey.value += 1
  page.value = Math.max(1, props.page ?? props.initialPage ?? 1)
  syncPageInput()
  zoom.value = clamp(props.zoom ?? props.initialZoom ?? 1, props.minZoom, props.maxZoom)
  rotation.value = normalizeRotation(props.rotation ?? props.initialRotation ?? 0)

  const previous = source.value
  const next = createFileViewerSource({
    src: props.src,
    file: props.file,
    name: props.name,
    type: props.type,
    size: props.size,
  })
  source.value = next
  previous?.dispose()

  if (!next) {
    status.value = 'empty'
    capabilities.value = defaultCapabilities(undefined)
    return
  }

  capabilities.value = defaultCapabilities(next.kind)
  const detected = detectFormat(next.name, next.mime)
  emit('load', {
    source: next,
    meta: {
      name: next.name,
      extension: next.extension,
      mime: next.mime,
      size: next.size,
      kind: next.kind,
      label: detected.label,
      supported: detected.supported,
    },
  })

  void probeRemoteSize(next)
  void loadRenderer(next)
}

async function download(): Promise<void> {
  const current = source.value
  if (!current) return
  try {
    triggerDownload(await current.getBlob(), current.name)
    emit('download', current)
    showNotice(messages.value.viewer.downloadStarted)
  } catch {
    if (current.url && openInNewTab(current.url)) {
      emit('download', current)
      showNotice(messages.value.viewer.downloadStarted)
    } else {
      showNotice(messages.value.viewer.downloadFailed, true)
    }
  }
}

function print(): void {
  const current = source.value
  if (!current) return
  const renderer = rendererRef.value as unknown as { print?: () => boolean | void } | null
  if (typeof renderer?.print === 'function') {
    if (renderer.print() === false) {
      showNotice(messages.value.viewer.printBlocked, true)
      return
    }
  } else if (!printUrl(current.url)) {
    showNotice(messages.value.viewer.printBlocked, true)
    return
  }
  emit('print', current)
}

function openFile(): void {
  const current = source.value
  if (!current) return
  if (!openInNewTab(current.url)) {
    showNotice(messages.value.viewer.openBlocked, true)
    return
  }
  emit('open', current)
}

function retry(): void {
  rebuildSource()
}

function onFullscreenChange(): void {
  if (typeof document === 'undefined') return
  const active = document.fullscreenElement === rootRef.value
  if (active) {
    isFullscreen.value = true
    pseudoFullscreen.value = false
    emit('fullscreen-change', true)
    return
  }
  if (!pseudoFullscreen.value) {
    isFullscreen.value = false
    emit('fullscreen-change', false)
  }
}

async function toggleFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return
  if (isFullscreen.value || document.fullscreenElement === rootRef.value) {
    if (pseudoFullscreen.value) {
      pseudoFullscreen.value = false
      isFullscreen.value = false
      emit('fullscreen-change', false)
      return
    }
    try {
      await document.exitFullscreen?.()
    } catch {
      // Ignore exit failures.
    }
    return
  }

  try {
    if (rootRef.value?.requestFullscreen) {
      // `fullscreenchange` is the single source of truth for state + events.
      await rootRef.value.requestFullscreen()
      return
    }
  } catch {
    // Fall back to an in-page overlay.
  }

  pseudoFullscreen.value = true
  isFullscreen.value = true
  emit('fullscreen-change', true)
}

function handleWheel(event: WheelEvent): void {
  if (!props.wheelZoom || !props.allowZoom || !capabilities.value.zoom) return
  if (!event.ctrlKey && !event.metaKey) return
  event.preventDefault()
  const factor = event.deltaY < 0 ? 1.12 : 0.89
  setZoom(zoom.value * factor)
}

function handleKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) return

  if (event.key === 'Escape') {
    if (pseudoFullscreen.value) {
      pseudoFullscreen.value = false
      isFullscreen.value = false
      emit('fullscreen-change', false)
      return
    }
    if (showInfo.value) {
      showInfo.value = false
      return
    }
  }

  if (!props.keyboard || event.ctrlKey || event.metaKey || event.altKey) return

  switch (event.key) {
    case 'ArrowLeft':
      if (hasPageControls.value) {
        event.preventDefault()
        previousPage()
      }
      break
    case 'ArrowRight':
      if (hasPageControls.value) {
        event.preventDefault()
        nextPage()
      }
      break
    case '+':
    case '=':
      if (props.allowZoom && capabilities.value.zoom) {
        event.preventDefault()
        zoomIn()
      }
      break
    case '-':
    case '_':
      if (props.allowZoom && capabilities.value.zoom) {
        event.preventDefault()
        zoomOut()
      }
      break
    case '0':
      if (props.allowZoom && capabilities.value.zoom) {
        event.preventDefault()
        resetZoom()
      }
      break
    case 'r':
    case 'R':
      if (props.allowRotate && capabilities.value.rotate) {
        event.preventDefault()
        rotateRight()
      }
      break
    case 'f':
    case 'F':
      if (props.allowFullscreen) {
        event.preventDefault()
        void toggleFullscreen()
      }
      break
    default:
      break
  }
}

function getState() {
  return {
    source: source.value,
    meta: meta.value,
    status: status.value,
    page: page.value,
    pageCount: pageCount.value,
    zoom: zoom.value,
    rotation: rotation.value,
    theme: resolvedTheme.value,
    capabilities: capabilities.value,
  }
}

function setTheme(theme: FileViewerResolvedTheme): void {
  themeOverride.value = theme
  emit('update:theme', theme)
}

defineExpose({
  reload: rebuildSource,
  zoomIn,
  zoomOut,
  resetZoom,
  rotateLeft,
  rotateRight,
  previousPage,
  nextPage,
  goToPage,
  download,
  print,
  open: openFile,
  toggleFullscreen,
  toggleTheme,
  setTheme,
  getState,
})

watch(
  () => [props.src, props.file, props.name, props.type, props.size] as const,
  () => rebuildSource(),
  { immediate: true },
)

watch(
  () => props.page,
  (value) => {
    if (value === undefined) return
    if (value !== page.value) applyPage(value, false)
  },
)

watch(
  () => props.zoom,
  (value) => {
    if (value === undefined) return
    const next = clamp(value, props.minZoom, props.maxZoom)
    if (next !== zoom.value) zoom.value = next
  },
)

watch(
  () => props.rotation,
  (value) => {
    if (value === undefined) return
    const next = normalizeRotation(value)
    if (next !== rotation.value) rotation.value = next
  },
)

watch(
  () => props.theme,
  () => {
    themeOverride.value = null
  },
)

watch(page, syncPageInput)

onErrorCaptured((cause) => {
  handleRendererError(cause)
  return false
})

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('fullscreenchange', onFullscreenChange)
  }
})

onBeforeUnmount(() => {
  loadToken += 1
  sizeToken += 1
  if (typeof document !== 'undefined') {
    document.removeEventListener('fullscreenchange', onFullscreenChange)
  }
  noticeTimeout.stop()
  source.value?.dispose()
})
</script>

<template>
  <div
    ref="rootRef"
    :class="rootClass"
    :style="rootStyle"
    role="region"
    tabindex="0"
    :aria-label="ariaLabel || displayTitle"
    :data-w-file-viewer-theme="resolvedTheme"
    :data-kind="meta?.kind"
    :data-status="status"
    :aria-busy="showLoading"
    @keydown="handleKeydown"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <header v-if="showToolbar" class="w-file-viewer__toolbar">
      <slot name="toolbar" v-bind="toolbarSlotProps">
        <div class="w-file-viewer__toolbar-left">
          <slot name="toolbar-left" v-bind="toolbarSlotProps">
            <span class="w-file-viewer__file-icon">
              <Icon name="file-viewer" :size="17" />
            </span>
            <span class="w-file-viewer__title" :title="displayTitle">{{ displayTitle }}</span>
            <span v-if="meta?.extension" class="w-file-viewer__badge">{{
              meta.extension.toUpperCase()
            }}</span>
          </slot>
        </div>

        <div class="w-file-viewer__toolbar-center">
          <div
            v-if="hasPageControls"
            class="w-file-viewer__group"
            role="group"
            :aria-label="messages.viewer.page"
          >
            <button
              type="button"
              class="w-file-viewer__icon-button"
              :disabled="page <= 1"
              :title="messages.viewer.previousPage"
              :aria-label="messages.viewer.previousPage"
              @click="previousPage"
            >
              <Icon name="chevron-left" />
            </button>
            <div class="w-file-viewer__page-field">
              <input
                v-model="pageInput"
                class="w-file-viewer__page-input"
                type="number"
                min="1"
                :max="pageCount"
                :aria-label="messages.viewer.pageInput"
                @change="commitPageInput"
                @keydown.enter.prevent="commitPageInput"
              />
              <span>{{ messages.viewer.pageOf }} {{ pageCount }}</span>
            </div>
            <button
              type="button"
              class="w-file-viewer__icon-button"
              :disabled="page >= pageCount"
              :title="messages.viewer.nextPage"
              :aria-label="messages.viewer.nextPage"
              @click="nextPage"
            >
              <Icon name="chevron-right" />
            </button>
          </div>

          <span
            v-if="hasPageControls && (capabilities.zoom || capabilities.rotate)"
            class="w-file-viewer__divider"
          />

          <div
            v-if="allowZoom && capabilities.zoom"
            class="w-file-viewer__group"
            role="group"
            :aria-label="messages.viewer.zoomIn"
          >
            <button
              type="button"
              class="w-file-viewer__icon-button"
              :title="messages.viewer.zoomOut"
              :aria-label="messages.viewer.zoomOut"
              @click="zoomOut"
            >
              <Icon name="zoom-out" />
            </button>
            <button
              type="button"
              class="w-file-viewer__zoom-value"
              :title="messages.viewer.resetZoom"
              :aria-label="messages.viewer.resetZoom"
              @click="resetZoom"
            >
              {{ zoomPercent }}
            </button>
            <button
              type="button"
              class="w-file-viewer__icon-button"
              :title="messages.viewer.zoomIn"
              :aria-label="messages.viewer.zoomIn"
              @click="zoomIn"
            >
              <Icon name="zoom-in" />
            </button>
          </div>

          <span
            v-if="capabilities.zoom && allowRotate && capabilities.rotate"
            class="w-file-viewer__divider"
          />

          <div
            v-if="allowRotate && capabilities.rotate"
            class="w-file-viewer__group"
            role="group"
            :aria-label="messages.viewer.rotateRight"
          >
            <button
              type="button"
              class="w-file-viewer__icon-button"
              :title="messages.viewer.rotateLeft"
              :aria-label="messages.viewer.rotateLeft"
              @click="rotateLeft"
            >
              <Icon name="rotate-left" />
            </button>
            <button
              type="button"
              class="w-file-viewer__icon-button"
              :title="messages.viewer.rotateRight"
              :aria-label="messages.viewer.rotateRight"
              @click="rotateRight"
            >
              <Icon name="rotate-right" />
            </button>
          </div>
        </div>

        <div class="w-file-viewer__toolbar-right">
          <slot name="toolbar-actions" v-bind="toolbarSlotProps" />
          <button
            v-if="allowDownload && source"
            type="button"
            class="w-file-viewer__icon-button"
            :title="messages.viewer.download"
            :aria-label="messages.viewer.download"
            @click="download"
          >
            <Icon name="download" />
          </button>
          <button
            v-if="allowOpen && source"
            type="button"
            class="w-file-viewer__icon-button"
            :title="messages.viewer.openInNewTab"
            :aria-label="messages.viewer.openInNewTab"
            @click="openFile"
          >
            <Icon name="external" />
          </button>
          <button
            v-if="allowPrint && capabilities.print"
            type="button"
            class="w-file-viewer__icon-button"
            :title="messages.viewer.print"
            :aria-label="messages.viewer.print"
            @click="print"
          >
            <Icon name="printer" />
          </button>
          <button
            v-if="source && showFileInfo"
            type="button"
            class="w-file-viewer__icon-button"
            :class="{ 'is-active': showInfo }"
            :title="messages.viewer.fileInfo"
            :aria-label="messages.viewer.fileInfo"
            :aria-expanded="showInfo"
            @click="showInfo = !showInfo"
          >
            <Icon name="info" />
          </button>
          <button
            v-if="showThemeToggle"
            type="button"
            class="w-file-viewer__icon-button"
            :title="isDark ? messages.viewer.switchToLight : messages.viewer.switchToDark"
            :aria-label="isDark ? messages.viewer.switchToLight : messages.viewer.switchToDark"
            @click="toggleTheme"
          >
            <Icon :name="isDark ? 'sun' : 'moon'" />
          </button>
          <button
            v-if="allowFullscreen"
            type="button"
            class="w-file-viewer__icon-button"
            :title="isFullscreen ? messages.viewer.exitFullscreen : messages.viewer.fullscreen"
            :aria-label="isFullscreen ? messages.viewer.exitFullscreen : messages.viewer.fullscreen"
            @click="toggleFullscreen"
          >
            <Icon :name="isFullscreen ? 'minimize' : 'expand'" />
          </button>
        </div>
      </slot>
    </header>

    <div class="w-file-viewer__content" @wheel="handleWheel">
      <div v-if="status === 'empty'" class="w-file-viewer__state">
        <slot name="empty" v-bind="stateSlotProps">
          <div class="w-file-viewer__state-icon">
            <Icon name="file-viewer" :size="30" />
          </div>
          <h3>{{ messages.viewer.empty }}</h3>
          <p>{{ messages.viewer.emptyHint }}</p>
        </slot>
      </div>

      <div v-else-if="status === 'error' && error" class="w-file-viewer__state is-error">
        <slot name="error" :error="error" :retry="retry">
          <div class="w-file-viewer__state-icon">
            <Icon name="alert" :size="30" />
          </div>
          <h3>{{ messages.viewer.errorTitle }}</h3>
          <p>{{ messages.viewer.errorDescription }}</p>
          <details class="w-file-viewer__error-details">
            <summary>{{ error.name || messages.viewer.errorTitle }}</summary>
            <span>{{ error.message }}</span>
          </details>
          <button type="button" class="w-file-viewer__button is-primary" @click="retry">
            <Icon name="retry" :size="15" />
            {{ messages.viewer.retry }}
          </button>
        </slot>
      </div>

      <template v-else>
        <div v-if="rendererComponent && meta" class="w-file-viewer__renderer">
          <component
            :is="rendererComponent"
            :key="rendererKey"
            ref="rendererRef"
            :source="source!"
            :kind="meta.kind"
            :options="options"
            :locale="locale"
            :messages="messages"
            :theme="resolvedTheme"
            :zoom="zoom"
            :rotation="rotation"
            :page="page"
            @ready="applyRendererReady"
            @error="handleRendererError"
            @page-change="handleRendererPageChange"
          />
        </div>

        <div v-if="showLoading" class="w-file-viewer__loading" role="status" aria-live="polite">
          <slot name="loading" v-bind="stateSlotProps">
            <span class="w-file-viewer__spinner" aria-hidden="true" />
            <span>{{
              status === 'loading' ? messages.viewer.loading : messages.viewer.parsing
            }}</span>
          </slot>
        </div>
      </template>

      <div v-if="isDraggingFile" class="w-file-viewer__drop-overlay" aria-hidden="true">
        <Icon name="file-viewer" :size="24" />
        <span>{{ messages.viewer.dropHint }}</span>
      </div>

      <div
        v-if="watermark"
        class="w-file-viewer__watermark"
        :style="watermarkStyle"
        aria-hidden="true"
      >
        <slot name="watermark" :text="watermark">
          <span v-for="index in 9" :key="index">{{ watermark }}</span>
        </slot>
      </div>

      <Transition name="w-file-viewer-notice">
        <div
          v-if="notice"
          class="w-file-viewer__toast"
          :class="{ 'is-error': notice.error }"
          role="status"
          aria-live="polite"
        >
          {{ notice.text }}
        </div>
      </Transition>
    </div>

    <aside
      v-if="showInfo && meta"
      class="w-file-viewer__info"
      role="dialog"
      :aria-label="messages.viewer.fileInfo"
    >
      <header>
        <strong>{{ messages.viewer.fileInfo }}</strong>
        <button
          type="button"
          class="w-file-viewer__icon-button is-small"
          :title="messages.viewer.close"
          :aria-label="messages.viewer.close"
          @click="showInfo = false"
        >
          <Icon name="close" :size="15" />
        </button>
      </header>
      <dl>
        <div>
          <dt>{{ messages.viewer.name }}</dt>
          <dd>{{ meta.name }}</dd>
        </div>
        <div>
          <dt>{{ messages.viewer.format }}</dt>
          <dd>
            {{ meta.label
            }}<template v-if="meta.extension"> · {{ meta.extension.toUpperCase() }}</template>
          </dd>
        </div>
        <div>
          <dt>{{ messages.viewer.type }}</dt>
          <dd>{{ meta.mime || messages.viewer.unknown }}</dd>
        </div>
        <div v-if="meta.size !== undefined">
          <dt>{{ messages.viewer.size }}</dt>
          <dd>{{ formatBytes(meta.size, locale) }}</dd>
        </div>
        <div v-if="source?.lastModified">
          <dt>{{ messages.viewer.lastModified }}</dt>
          <dd>{{ formatDateTime(source.lastModified, locale) }}</dd>
        </div>
      </dl>
    </aside>

    <footer v-if="showStatusBar" class="w-file-viewer__status">
      <slot
        name="status-bar"
        :source="source"
        :meta="meta"
        :page="page"
        :pageCount="pageCount"
        :zoom="zoom"
      >
        <span v-if="meta" class="w-file-viewer__status-format">{{ meta.label }}</span>
        <span v-if="meta?.size !== undefined" class="w-file-viewer__status-item">{{
          formatBytes(meta.size, locale)
        }}</span>
        <span v-if="capabilities.paged && pageCount > 0" class="w-file-viewer__status-item">
          {{ messages.viewer.page }} {{ page }} / {{ pageCount }}
        </span>
        <span v-if="capabilities.zoom" class="w-file-viewer__status-item">{{ zoomPercent }}</span>
        <span class="w-file-viewer__status-spacer" />
      </slot>
    </footer>
  </div>
</template>
