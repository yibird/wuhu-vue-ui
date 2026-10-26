<script setup lang="ts">
import type { Editor as CoreEditor } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EditorToolbar from './EditorToolbar.vue'
import { createTiptapExtensions } from './extensions'
import { defaultTiptapEditorLabels } from './labels'
import type {
  TiptapEditorEmits,
  TiptapEditorExpose,
  TiptapEditorProps,
  TiptapEditorSize,
  TiptapEditorSlots,
} from './types'

defineOptions({ name: 'WTiptapEditor' })

const props = withDefaults(defineProps<TiptapEditorProps>(), {
  modelValue: '',
  placeholder: '请输入内容…',
  editable: true,
  disabled: false,
  toolbar: true,
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
const ariaLabel = computed(() => props.ariaLabel ?? labels.value.editor)
const fullscreen = ref(false)
const stats = ref({ characters: 0, words: 0 })
const uploadingCount = ref(0)
const dragging = ref(false)

let previousBodyOverflow = ''
let bodyOverflowLocked = false
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

async function insertImageFiles(files: File[], position?: number): Promise<void> {
  if (!files.length) return

  const results: PromiseSettledResult<string>[] = []
  // Keep uploads bounded so dropping a large batch does not saturate the network.
  for (let index = 0; index < files.length; index += 3) {
    const batch = files.slice(index, index + 3)
    results.push(...(await Promise.allSettled(batch.map((file) => runUpload(file)))))
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

  const instance = editor.value
  if (!instance || instance.isDestroyed || !nodes.length) return

  const content = nodes.length === 1 ? nodes[0]! : nodes
  if (typeof position === 'number') {
    instance.chain().focus().insertContentAt(position, content).run()
  } else {
    instance.chain().focus().insertContent(content).run()
  }
}

function handleImageError(error: Error, file: File | null): void {
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

function updateStats(instance: CoreEditor | undefined = editor.value): void {
  if (!instance) return
  const text = instance.getText({ blockSeparator: '\n' })
  stats.value = { characters: text.length, words: countWords(text) }
}

function scheduleStats(instance: CoreEditor): void {
  if (statsTimer) clearTimeout(statsTimer)
  statsTimer = setTimeout(() => {
    statsTimer = undefined
    updateStats(instance)
  }, 120)
}

function syncAria(): void {
  const dom = editor.value?.view.dom
  if (!dom) return
  dom.setAttribute('aria-disabled', String(props.disabled))
  dom.setAttribute('aria-readonly', String(!props.editable))
}

function toggleFullscreen(): void {
  fullscreen.value = !fullscreen.value
}

function handleWindowKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && fullscreen.value) {
    fullscreen.value = false
  }
}

function hasImageFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files')
}

function onDragEnter(event: DragEvent): void {
  if (!editable.value || !hasImageFiles(event)) return
  event.preventDefault()
  dragging.value = true
}

function onDragOver(event: DragEvent): void {
  if (!editable.value || !hasImageFiles(event)) return
  event.preventDefault()
  dragging.value = true
}

function onDragLeave(event: DragEvent): void {
  const current = event.currentTarget as HTMLElement | null
  const next = event.relatedTarget as Node | null
  if (!current || !next || !current.contains(next)) dragging.value = false
}

function onDropEnd(): void {
  dragging.value = false
}

const editor = useEditor({
  content: props.modelValue,
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
      void insertImageFiles(files, view.state.selection.from)
      return true
    },
    handleDrop(view, event, _slice, moved) {
      if (moved) return false

      const files = imageFilesFrom(event.dataTransfer?.files, event.dataTransfer?.items)
      if (!files.length) return false

      event.preventDefault()
      const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
      void insertImageFiles(files, coordinates?.pos)
      return true
    },
  },
  onCreate: ({ editor: instance }) => {
    updateStats(instance)
    syncAria()
    emit('ready', instance)
  },
  onUpdate: ({ editor: instance }) => {
    scheduleStats(instance)
    const html = instance.getHTML()
    if (html === props.modelValue) return
    emit('update:modelValue', html)
    emit('change', html)
  },
  onFocus: ({ editor: instance }) => emit('focus', instance),
  onBlur: ({ editor: instance }) => {
    updateStats(instance)
    emit('blur', instance)
  },
})

watch(
  () => props.modelValue,
  (value) => {
    const instance = editor.value
    if (!instance) return

    const next = value ?? ''
    if (next === instance.getHTML() || (!next && instance.isEmpty)) return
    instance.commands.setContent(next, { emitUpdate: false })
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

  if (value) {
    if (bodyOverflowLocked) return
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    bodyOverflowLocked = true
    return
  }

  if (!bodyOverflowLocked) return
  document.body.style.overflow = previousBodyOverflow
  bodyOverflowLocked = false
})

onMounted(() => {
  window.addEventListener('keydown', handleWindowKeydown)
})

onBeforeUnmount(() => {
  disposed = true
  uploadController.abort()
  if (statsTimer) clearTimeout(statsTimer)
  statsTimer = undefined
  window.removeEventListener('keydown', handleWindowKeydown)
  if (typeof document !== 'undefined' && bodyOverflowLocked) {
    document.body.style.overflow = previousBodyOverflow
    bodyOverflowLocked = false
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
    updateStats()
  },
  setContent: (content, emitUpdate = false) => {
    editor.value?.commands.setContent(content, { emitUpdate })
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
    <slot v-if="toolbar && editable && editor" name="toolbar" :editor="editor">
      <EditorToolbar
        :editor="editor"
        :labels="labels"
        :disabled="disabled"
        :upload-image="runUpload"
        :image-accept="imageAccept"
        :fullscreen="fullscreen"
        :allow-fullscreen="allowFullscreen"
        @error="handleImageError"
        @toggle-fullscreen="toggleFullscreen"
      />
    </slot>

    <div class="w-tiptap-editor__body">
      <EditorContent :editor="editor" />
    </div>

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
