<script setup lang="ts">
import type { Editor as CoreEditor } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EditorPreview from './EditorPreview.vue'
import EditorToolbar from './EditorToolbar.vue'
import TableBubbleMenu from './TableBubbleMenu.vue'
import { createTiptapExtensions } from './extensions'
import { defaultTiptapEditorLabels } from './labels'
import { lockBodyScroll, unlockBodyScroll } from './scrollLock'
import type {
  TiptapEditorEmits,
  TiptapEditorExpose,
  TiptapEditorProps,
  TiptapEditorSize,
  TiptapEditorSlots,
} from './types'

const props = withDefaults(defineProps<TiptapEditorProps>(), {
  value: '',
  placeholder: '请输入内容…',
  editable: true,
  disabled: false,
  toolbar: true,
  preview: false,
  minHeight: 160,
  maxHeight: 520,
  ariaLabel: undefined,
  labels: undefined,
  imageUpload: undefined,
  imageAccept: 'image/*',
  imageMaxSize: 10,
  showCount: true,
  allowFullscreen: true,
  extensions: undefined,
})

const emit = defineEmits<TiptapEditorEmits>()
defineSlots<TiptapEditorSlots>()

const labels = computed(() => ({ ...defaultTiptapEditorLabels, ...props.labels }))
const editable = computed(() => props.editable && !props.disabled)
// Bare `preview` attributes arrive as an empty string in template compilations;
// only an explicit `false` should disable the pane.
const previewVisible = ref(props.preview !== false)
const previewEnabled = computed(() => previewVisible.value)

watch(
  () => props.preview,
  (value) => {
    previewVisible.value = value !== false
  },
)

function togglePreview() {
  previewVisible.value = !previewVisible.value
  emit('update:preview', previewVisible.value)
}

const previewRatio = ref(0.5)
const bodyRef = ref<HTMLElement>()
let splitCleanup: (() => void) | undefined

const bodyStyle = computed<Record<string, string> | undefined>(() =>
  previewEnabled.value
    ? { '--w-tiptap-editor-split': `${Math.round(previewRatio.value * 100)}%` }
    : undefined,
)

const splitterValue = computed(() => Math.round(previewRatio.value * 100))

function clampSplit(value: number) {
  return Math.min(0.8, Math.max(0.2, value))
}

function handleSplitterPointerDown(event: PointerEvent) {
  if (event.button !== 0) return

  const body = bodyRef.value
  if (!body) return

  const rect = body.getBoundingClientRect()
  if (rect.width === 0) return

  event.preventDefault()
  const pointerId = event.pointerId
  const startX = event.clientX
  const startRatio = previewRatio.value

  const move = (moveEvent: PointerEvent) => {
    if (moveEvent.pointerId !== pointerId) return
    previewRatio.value = clampSplit(startRatio + (moveEvent.clientX - startX) / rect.width)
  }

  const stop = (endEvent?: PointerEvent) => {
    if (endEvent && endEvent.pointerId !== pointerId) return
    splitCleanup?.()
  }

  splitCleanup?.()
  splitCleanup = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    splitCleanup = undefined
  }

  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', stop)
  window.addEventListener('pointercancel', stop)
}

function handleSplitterKeydown(event: KeyboardEvent) {
  const step = event.shiftKey ? 0.1 : 0.02
  let next = previewRatio.value

  if (event.key === 'ArrowLeft') next -= step
  else if (event.key === 'ArrowRight') next += step
  else if (event.key === 'Home') next = 0.2
  else if (event.key === 'End') next = 0.8
  else return

  event.preventDefault()
  previewRatio.value = clampSplit(next)
}
const ariaLabel = computed(() => props.ariaLabel ?? labels.value.editor)
const fullscreen = ref(false)
const stats = ref({ characters: 0, words: 0 })
const previewHtml = ref(props.value)
const uploadingCount = ref(0)
const dragging = ref(false)

let bodyLocked = false
let disposed = false
let statsTimer: ReturnType<typeof setTimeout> | undefined
let wordSegmenter: Intl.Segmenter | null = null
const uploadController = new AbortController()

function toCssSize(value: TiptapEditorSize): string {
  return typeof value === 'number' ? `${value}px` : value
}

const rootStyle = computed(() => ({
  '--w-tiptap-editor-min-height': toCssSize(props.minHeight),
  '--w-tiptap-editor-max-height': toCssSize(props.maxHeight),
}))

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

function readFileAsDataUrl(file: File, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Upload aborted', 'AbortError'))
      return
    }

    const reader = new FileReader()
    const onAbort = () => {
      reader.abort()
      reject(new DOMException('Upload aborted', 'AbortError'))
    }

    signal.addEventListener('abort', onAbort, { once: true })
    reader.onload = () => {
      signal.removeEventListener('abort', onAbort)
      resolve(String(reader.result ?? ''))
    }
    reader.onerror = () => {
      signal.removeEventListener('abort', onAbort)
      reject(reader.error ?? new Error(labels.value.imageUploadFailed))
    }
    reader.readAsDataURL(file)
  })
}

async function performUpload(file: File, signal: AbortSignal): Promise<string> {
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error(labels.value.imageInvalidType)
  }

  if (props.imageMaxSize > 0 && file.size > props.imageMaxSize * 1024 * 1024) {
    throw new Error(labels.value.imageTooLarge.replace('{max}', String(props.imageMaxSize)))
  }

  if (props.imageUpload) {
    const url = await props.imageUpload(file, signal)
    if (!url) throw new Error(labels.value.imageUploadFailed)
    return url
  }

  return readFileAsDataUrl(file, signal)
}

/** Tracks progress and emits lifecycle events around a single upload. */
async function runUpload(file: File): Promise<string> {
  emit('image-upload-start', file)
  uploadingCount.value += 1
  try {
    const url = await performUpload(file, uploadController.signal)
    emit('image-upload-success', url, file)
    return url
  } finally {
    uploadingCount.value = Math.max(0, uploadingCount.value - 1)
  }
}

function imageFilesFrom(
  files: FileList | null | undefined,
  items?: DataTransferItemList | null,
): File[] {
  let list = Array.from(files ?? [])
  if (!list.length && items) {
    list = Array.from(items)
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null)
  }
  return list.filter((file) => file.type.startsWith('image/'))
}

interface PositionMapping {
  map: (position: number, assoc?: number) => number
}

async function insertImageFiles(files: File[], position?: number): Promise<void> {
  if (!files.length) return

  const instance = editor.value
  const mappings: PositionMapping[] = []
  const trackPosition = typeof position === 'number' && instance
  const onTransaction = ({
    transaction,
  }: {
    transaction: { docChanged: boolean; mapping: PositionMapping }
  }) => {
    if (transaction.docChanged) mappings.push(transaction.mapping)
  }

  if (trackPosition) instance.on('transaction', onTransaction)

  const results: PromiseSettledResult<string>[] = []
  try {
    // Keep uploads bounded so dropping a large batch does not saturate the network.
    for (let index = 0; index < files.length; index += 3) {
      const batch = files.slice(index, index + 3)
      results.push(...(await Promise.allSettled(batch.map((file) => runUpload(file)))))
    }
  } finally {
    if (trackPosition) instance.off('transaction', onTransaction)
  }
  if (disposed) return

  const nodes: { type: string; attrs: { src: string; alt: string } }[] = []
  results.forEach((result, index) => {
    const file = files[index]!
    if (result.status === 'fulfilled') {
      nodes.push({ type: 'image', attrs: { src: result.value, alt: file.name } })
    } else {
      emit('image-upload-error', toError(result.reason), file)
    }
  })

  if (!instance || instance.isDestroyed || !nodes.length) return

  const content = nodes.length === 1 ? nodes[0]! : nodes
  if (typeof position === 'number') {
    // Map the original paste/drop position through every edit made while the
    // uploads were running instead of inserting at a stale offset.
    let target = position
    for (const mapping of mappings) target = mapping.map(target, 1)
    target = Math.min(Math.max(target, 0), instance.state.doc.content.size)
    instance.chain().focus().insertContentAt(target, content).run()
  } else {
    instance.chain().focus().insertContent(content).run()
  }
}

function handleImageError(error: Error, file: File | null) {
  if (file) emit('image-upload-error', error, file)
}

function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0

  try {
    wordSegmenter ??= new Intl.Segmenter(undefined, { granularity: 'word' })
    return Array.from(wordSegmenter.segment(trimmed)).filter((segment) => segment.isWordLike).length
  } catch {
    return trimmed.split(/\s+/).filter(Boolean).length
  }
}

function updateStats(instance: CoreEditor | undefined = editor.value) {
  if (!instance) return
  const text = instance.getText({ blockSeparator: '\n' })
  stats.value = { characters: text.length, words: countWords(text) }
}

function scheduleStats(instance: CoreEditor) {
  if (statsTimer) clearTimeout(statsTimer)
  statsTimer = setTimeout(() => {
    statsTimer = undefined
    updateStats(instance)
  }, 120)
}

function syncAria() {
  const dom = editor.value?.view.dom
  if (!dom) return
  dom.setAttribute('aria-disabled', String(props.disabled))
  dom.setAttribute('aria-readonly', String(!props.editable))
}

function toggleFullscreen() {
  fullscreen.value = !fullscreen.value
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && fullscreen.value) {
    fullscreen.value = false
  }
}

function hasImageFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files')
}

function onDragEnter(event: DragEvent) {
  if (!editable.value || !hasImageFiles(event)) return
  event.preventDefault()
  dragging.value = true
}

function onDragOver(event: DragEvent) {
  if (!editable.value || !hasImageFiles(event)) return
  event.preventDefault()
  dragging.value = true
}

function onDragLeave(event: DragEvent) {
  const current = event.currentTarget as HTMLElement | null
  const next = event.relatedTarget as Node | null
  if (!current || !next || !current.contains(next)) dragging.value = false
}

function onDropEnd() {
  dragging.value = false
}

const editor = useEditor({
  content: props.value,
  editable: editable.value,
  extensions: createTiptapExtensions(() => props.placeholder, props.extensions),
  editorProps: {
    attributes: {
      class: 'w-tiptap-editor__prosemirror',
      role: 'textbox',
      'aria-multiline': 'true',
      'aria-label': ariaLabel.value,
    },
    handlePaste(view, event) {
      const files = imageFilesFrom(event.clipboardData?.files, event.clipboardData?.items)
      if (!files.length) return false

      event.preventDefault()
      insertImageFiles(files, view.state.selection.from)
      return true
    },
    handleDrop(view, event, _slice, moved) {
      if (moved) return false

      const files = imageFilesFrom(event.dataTransfer?.files, event.dataTransfer?.items)
      if (!files.length) return false

      event.preventDefault()
      const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
      insertImageFiles(files, coordinates?.pos)
      return true
    },
  },
  onCreate: ({ editor: instance }) => {
    updateStats(instance)
    syncAria()
    previewHtml.value = instance.getHTML()
    emit('ready', instance)
  },
  onUpdate: ({ editor: instance }) => {
    scheduleStats(instance)
    const html = instance.getHTML()
    previewHtml.value = html
    if (html === props.value) return
    emit('update:value', html)
    emit('change', html)
  },
  onFocus: ({ editor: instance }) => emit('focus', instance),
  onBlur: ({ editor: instance }) => {
    updateStats(instance)
    emit('blur', instance)
  },
})

watch(
  () => props.value,
  (value) => {
    const instance = editor.value
    if (!instance) return

    const next = value ?? ''
    if (next === instance.getHTML() || (!next && instance.isEmpty)) return
    instance.commands.setContent(next, { emitUpdate: false })
    previewHtml.value = instance.getHTML()
    updateStats(instance)
  },
)

watch(editable, (value) => {
  editor.value?.setEditable(value)
})

watch([() => props.editable, () => props.disabled], syncAria)

watch(ariaLabel, (value) => {
  editor.value?.view.dom.setAttribute('aria-label', value)
})

watch(fullscreen, (value) => {
  if (typeof document === 'undefined') return

  if (value && !bodyLocked) {
    lockBodyScroll()
    bodyLocked = true
  } else if (!value && bodyLocked) {
    unlockBodyScroll()
    bodyLocked = false
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleWindowKeydown)
})

onBeforeUnmount(() => {
  disposed = true
  uploadController.abort()
  if (statsTimer) clearTimeout(statsTimer)
  statsTimer = undefined
  splitCleanup?.()
  window.removeEventListener('keydown', handleWindowKeydown)
  if (bodyLocked) {
    unlockBodyScroll()
    bodyLocked = false
  }
})

defineExpose<TiptapEditorExpose>({
  get editor() {
    return editor.value ?? null
  },
  focus: (position) => editor.value?.commands.focus(position),
  blur: () => editor.value?.commands.blur(),
  clearContent: (emitUpdate = true) => {
    editor.value?.commands.clearContent(emitUpdate)
    previewHtml.value = editor.value?.getHTML() ?? ''
    updateStats()
  },
  setContent: (content, emitUpdate = false) => {
    editor.value?.commands.setContent(content, { emitUpdate })
    previewHtml.value = editor.value?.getHTML() ?? ''
    updateStats()
  },
  getHTML: () => editor.value?.getHTML() ?? '',
  getJSON: () => editor.value?.getJSON() ?? { type: 'doc', content: [] },
})
</script>

<template>
  <div
    class="w-tiptap-editor"
    :class="{
      'is-disabled': disabled,
      'is-readonly': !editable,
      'is-fullscreen': fullscreen,
      'is-dragging': dragging && editable,
    }"
    :style="rootStyle"
    :aria-busy="uploadingCount > 0 ? 'true' : undefined"
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDropEnd"
  >
    <slot
      v-if="toolbar && editable && editor"
      name="toolbar"
      :editor="editor"
      :preview="previewEnabled"
      :toggle-preview="togglePreview"
    >
      <EditorToolbar
        :editor="editor"
        :labels="labels"
        :disabled="disabled"
        :upload-image="runUpload"
        :image-accept="imageAccept"
        :fullscreen="fullscreen"
        :allow-fullscreen="allowFullscreen"
        :preview="previewEnabled"
        @error="handleImageError"
        @ai="emit('ai', $event)"
        @toggle-fullscreen="toggleFullscreen"
        @toggle-preview="togglePreview"
      />
    </slot>

    <div
      ref="bodyRef"
      class="w-tiptap-editor__body"
      :class="{ 'is-preview': previewEnabled }"
      :style="bodyStyle"
    >
      <div class="w-tiptap-editor__editor">
        <EditorContent :editor="editor" />
      </div>
      <div
        v-if="previewEnabled"
        class="w-tiptap-editor__splitter"
        role="separator"
        aria-orientation="vertical"
        :aria-label="labels.previewSplitter"
        :aria-valuemin="20"
        :aria-valuemax="80"
        :aria-valuenow="splitterValue"
        tabindex="0"
        @pointerdown="handleSplitterPointerDown"
        @keydown="handleSplitterKeydown"
      />
      <div v-if="previewEnabled" class="w-tiptap-editor__preview">
        <EditorPreview :content="previewHtml" :label="labels.preview" :extensions="extensions" />
      </div>
    </div>

    <TableBubbleMenu v-if="editor" :editor="editor" :labels="labels" />

    <div v-if="dragging && editable" class="w-tiptap-editor__dropzone" aria-hidden="true">
      {{ labels.dropImage }}
    </div>

    <div v-if="uploadingCount > 0" class="w-tiptap-editor__status" role="status" aria-live="polite">
      {{ labels.imageUploading }}
    </div>

    <div v-if="showCount" class="w-tiptap-editor__footer">
      <span>{{ stats.characters }} {{ labels.characters }}</span>
      <span aria-hidden="true">·</span>
      <span>{{ stats.words }} {{ labels.words }}</span>
    </div>
  </div>
</template>
