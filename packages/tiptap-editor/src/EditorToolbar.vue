<script setup lang="ts">
import type { Editor } from '@tiptap/core'
import { vTooltip } from '@wuhu-vue-ui/tooltip'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import ImageForm from './ImageForm.vue'
import ToolbarIcon from './ToolbarIcon.vue'
import { TIPTAP_FONT_FAMILIES } from './fonts'
import type { ToolbarIconName } from './icons'
import type { TiptapEditorImageUpload, TiptapEditorLabels } from './types'

const props = defineProps<{
  editor: Editor
  labels: TiptapEditorLabels
  disabled?: boolean
  uploadImage: TiptapEditorImageUpload
  imageAccept: string
  fullscreen?: boolean
  allowFullscreen?: boolean
  preview?: boolean
}>()

const emit = defineEmits<{
  error: [error: Error, file: File | null]
  ai: [request: { editor: Editor; prompt: string }]
  'toggle-fullscreen': []
  'toggle-preview': []
}>()

function handleImageError(error: Error, file: File | null) {
  emit('error', error, file)
}

interface ToolbarItem {
  id: string
  label: string
  icon?: ToolbarIconName
  text?: string
  textClass?: string
  toggle?: boolean
  active?: boolean
  disabled?: boolean
  action?: () => void
}

type Popover = 'link' | 'image' | 'video' | 'attachment' | 'ai' | 'emoji' | 'table' | null

const popover = ref<Popover>(null)
const linkValue = ref('')
const linkInput = ref<HTMLInputElement>()
const colorInput = ref<HTMLInputElement>()
const toolbarRef = ref<HTMLElement>()
const activeToolId = ref('')
let refreshScheduled = false

/**
 * Tiptap's editor is not a Vue reactive object, so the toolbar snapshots every
 * value it renders and replaces the snapshot when the editor transaction or
 * selection changes. Reading the snapshot needs no dependency-collection
 * tricks inside individual computeds.
 */
function readSnapshot() {
  const editor = props.editor
  const textStyle = editor.getAttributes('textStyle')

  return {
    editable: editor.isEditable,
    canUndo: editor.can().undo(),
    canRedo: editor.can().redo(),
    color: typeof textStyle.color === 'string' && textStyle.color ? textStyle.color : '#0f172a',
    fontFamily: typeof textStyle.fontFamily === 'string' ? textStyle.fontFamily : '',
    fontSize: typeof textStyle.fontSize === 'string' ? textStyle.fontSize : '',
    active: {
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      strike: editor.isActive('strike'),
      code: editor.isActive('code'),
      subscript: editor.isActive('subscript'),
      superscript: editor.isActive('superscript'),
      highlight: editor.isActive('highlight'),
      heading1: editor.isActive('heading', { level: 1 }),
      heading2: editor.isActive('heading', { level: 2 }),
      heading3: editor.isActive('heading', { level: 3 }),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      taskList: editor.isActive('taskList'),
      blockquote: editor.isActive('blockquote'),
      codeBlock: editor.isActive('codeBlock'),
      link: editor.isActive('link'),
      table: editor.isActive('table'),
      alignLeft: editor.isActive({ textAlign: 'left' }),
      alignCenter: editor.isActive({ textAlign: 'center' }),
      alignRight: editor.isActive({ textAlign: 'right' }),
    },
  }
}

const snapshot = shallowRef(readSnapshot())

/** Coalesce the transaction + selectionUpdate pair into one recompute. */
function refresh() {
  if (refreshScheduled) return
  refreshScheduled = true
  queueMicrotask(() => {
    refreshScheduled = false
    snapshot.value = readSnapshot()
  })
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!popover.value) return
  const target = event.target as Node | null
  if (target && toolbarRef.value?.contains(target)) return
  // Outside clicks dismiss the panel without stealing focus from the target.
  popover.value = null
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (popover.value) popover.value = null
  if (paintedMarks.value) stopFormatPainter()
}

onMounted(() => {
  props.editor.on('transaction', refresh)
  props.editor.on('selectionUpdate', refresh)
  document.addEventListener('pointerdown', onDocumentPointerDown)
  window.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  props.editor.off('transaction', refresh)
  props.editor.off('selectionUpdate', refresh)
  stopFormatPainter()
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  window.removeEventListener('keydown', onDocumentKeydown)
})

function chain() {
  return props.editor.chain().focus()
}

function closePopover() {
  popover.value = null
  chain().run()
}

function runTool(item: ToolbarItem) {
  popover.value = null
  item.action?.()
}

function togglePopover(next: Exclude<Popover, null>) {
  popover.value = popover.value === next ? null : next
}

function focusTool(id: string) {
  activeToolId.value = id
  nextTick(() => {
    toolbarRef.value?.querySelector<HTMLButtonElement>(`[data-tool-id="${id}"]`)?.focus()
  })
}

function onToolbarKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  if (!target?.classList.contains('w-tiptap-editor__tool')) return
  if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return

  const enabled = flatItems.value.filter((item) => !item.disabled)
  if (!enabled.length) return

  event.preventDefault()
  const current = enabled.findIndex((item) => item.id === target.dataset.toolId)
  let next = 0

  if (event.key === 'End') {
    next = enabled.length - 1
  } else if (event.key === 'ArrowRight') {
    next = (current + 1 + enabled.length) % enabled.length
  } else if (event.key === 'ArrowLeft') {
    next = (current - 1 + enabled.length) % enabled.length
  }

  focusTool(enabled[next]!.id)
}

function toggleLink() {
  if (props.editor.isActive('link')) {
    chain().unsetLink().run()
    return
  }

  if (popover.value === 'link') {
    popover.value = null
    return
  }

  linkValue.value = String(props.editor.getAttributes('link').href ?? '')
  popover.value = 'link'
  void nextTick(() => linkInput.value?.focus())
}

function normalizeHref(value: string): string {
  return /^(https?:|mailto:|tel:|\/|#)/i.test(value) ? value : `https://${value}`
}

function applyLink() {
  const value = linkValue.value.trim()
  if (value) {
    chain()
      .extendMarkRange('link')
      .setLink({ href: normalizeHref(value) })
      .run()
  } else {
    chain().extendMarkRange('link').unsetLink().run()
  }
  popover.value = null
}

const currentColor = computed(() => snapshot.value.color)

function openColorPicker() {
  colorInput.value?.click()
}

function applyColor(event: Event) {
  const value = (event.target as HTMLInputElement).value
  chain().setColor(value).run()
}

const currentFontFamily = computed(() => snapshot.value.fontFamily)

function applyFontFamily(value: string) {
  if (value) chain().setFontFamily(value).run()
  else chain().unsetFontFamily().run()
}

function handleFontChange(event: Event) {
  applyFontFamily((event.target as HTMLSelectElement).value)
}

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'] as const

const currentFontSize = computed(() => snapshot.value.fontSize)

function handleFontSizeChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value) chain().setFontSize(value).run()
  else chain().unsetFontSize().run()
}

const BLOCK_OPTIONS = [
  { value: 'paragraph', label: 'paragraph' },
  { value: '1', label: 'heading1' },
  { value: '2', label: 'heading2' },
  { value: '3', label: 'heading3' },
] as const

const currentBlock = computed(() => {
  const active = snapshot.value.active
  if (active.heading1) return '1'
  if (active.heading2) return '2'
  if (active.heading3) return '3'
  return 'paragraph'
})

function handleBlockChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value

  if (value === 'paragraph') {
    chain().setParagraph().run()
    return
  }

  chain()
    .setHeading({ level: Number(value) as 1 | 2 | 3 })
    .run()
}

const TABLE_PICKER_ROWS = 8
const TABLE_PICKER_COLS = 8

const tablePickerRows = ref(0)
const tablePickerCols = ref(0)

const tablePickerCells = computed(() =>
  Array.from({ length: TABLE_PICKER_ROWS * TABLE_PICKER_COLS }, (_, index) => ({
    row: Math.floor(index / TABLE_PICKER_COLS) + 1,
    col: (index % TABLE_PICKER_COLS) + 1,
  })),
)

const tableSizeLabel = computed(() =>
  props.labels.tableSize
    .replace('{rows}', String(tablePickerRows.value))
    .replace('{cols}', String(tablePickerCols.value)),
)

const tablePickerAlign = ref<'left' | 'right'>('left')
const TABLE_PICKER_WIDTH = 190

/**
 * The editor root clips overflowing content, so flip the picker to the left
 * edge of its trigger when there is not enough room on the right.
 */
function openTablePicker() {
  const trigger = toolbarRef.value?.querySelector<HTMLElement>('[data-tool-id="table"]')
  const editorRoot = toolbarRef.value?.closest<HTMLElement>('.w-tiptap-editor')

  if (trigger && editorRoot) {
    const triggerRect = trigger.getBoundingClientRect()
    const editorRect = editorRoot.getBoundingClientRect()
    tablePickerAlign.value =
      triggerRect.left + TABLE_PICKER_WIDTH > editorRect.right - 8 ? 'right' : 'left'
  }

  tablePickerRows.value = 0
  tablePickerCols.value = 0
  popover.value = 'table'
}

function closeTablePicker() {
  if (popover.value === 'table') popover.value = null
}

function previewTableSize(rows: number, cols: number) {
  tablePickerRows.value = rows
  tablePickerCols.value = cols
}

function insertTable(rows: number, cols: number) {
  chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
  popover.value = null
}

const EMOJIS = [
  '😀',
  '😄',
  '😁',
  '🙂',
  '😉',
  '😍',
  '🤔',
  '😎',
  '😢',
  '😡',
  '👍',
  '👎',
  '👏',
  '🙏',
  '💡',
  '✅',
  '❌',
  '⚠️',
  '🔥',
  '🎉',
  '❤️',
  '⭐',
  '📌',
  '🚀',
] as const

function insertEmoji(emoji: string) {
  chain().insertContent(emoji).run()
  popover.value = null
}

const videoUrl = ref('')
const attachmentUrl = ref('')
const attachmentName = ref('')
const aiPrompt = ref('')

function toggleVideoForm() {
  videoUrl.value = ''
  popover.value = popover.value === 'video' ? null : 'video'
}

function applyVideo() {
  const value = videoUrl.value.trim()
  if (!value) return
  chain().setVideo(normalizeHref(value)).run()
  popover.value = null
}

function toggleAttachmentForm() {
  attachmentUrl.value = ''
  attachmentName.value = ''
  popover.value = popover.value === 'attachment' ? null : 'attachment'
}

function applyAttachment() {
  const href = attachmentUrl.value.trim()
  if (!href) return
  const name = attachmentName.value.trim()
  chain()
    .setAttachment({ href: normalizeHref(href), name: name || undefined })
    .run()
  popover.value = null
}

function toggleAiForm() {
  aiPrompt.value = ''
  popover.value = popover.value === 'ai' ? null : 'ai'
}

function applyAi() {
  const prompt = aiPrompt.value.trim()
  if (!prompt) return
  emit('ai', { editor: props.editor, prompt })
  popover.value = null
}

/**
 * Print only the document body through a hidden iframe so the host page,
 * toolbar and surrounding layout never reach the printer.
 */
function printContent() {
  if (typeof document === 'undefined') return

  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const frameDocument = iframe.contentDocument
  const frameWindow = iframe.contentWindow
  if (!frameDocument || !frameWindow) {
    iframe.remove()
    return
  }

  frameDocument.open()
  frameDocument.write(
    `<!doctype html><html><head><meta charset="utf-8"><style>${PRINT_STYLES}</style></head><body>${props.editor.getHTML()}</body></html>`,
  )
  frameDocument.close()
  frameWindow.focus()
  frameWindow.print()
  window.setTimeout(() => iframe.remove(), 1000)
}

const PRINT_STYLES = `
  body { margin: 0; padding: 24px; color: #0f172a; font: 14px/1.6 system-ui, sans-serif; }
  img, video { max-width: 100%; height: auto; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top; }
  blockquote { margin: 0 0 12px; padding-left: 12px; border-left: 3px solid #cbd5e1; }
  pre { padding: 10px 12px; background: #f1f5f9; overflow-x: auto; }
  a { color: #4f46e5; }
`

interface PaintedMark {
  type: string
  attrs: Record<string, unknown>
}

const paintedMarks = shallowRef<PaintedMark[] | null>(null)
const painterActive = computed(() => paintedMarks.value !== null)
let painterSelection = { from: -1, to: -1 }

function stopFormatPainter() {
  paintedMarks.value = null
  props.editor.off('selectionUpdate', applyPaintedMarks)
}

function applyPaintedMarks() {
  const marks = paintedMarks.value
  if (!marks) return

  const { selection } = props.editor.state
  if (selection.empty) return
  if (selection.from === painterSelection.from && selection.to === painterSelection.to) return

  const chain = props.editor.chain().focus().unsetAllMarks()
  for (const mark of marks) chain.setMark(mark.type, mark.attrs)
  chain.run()
  stopFormatPainter()
}

function toggleFormatPainter() {
  if (paintedMarks.value) {
    stopFormatPainter()
    return
  }

  const { state } = props.editor
  paintedMarks.value = state.selection.$from.marks().map((mark) => ({
    type: mark.type.name,
    attrs: { ...mark.attrs },
  }))
  painterSelection = { from: state.selection.from, to: state.selection.to }
  props.editor.on('selectionUpdate', applyPaintedMarks)
}

const groups = computed<ToolbarItem[][]>(() => {
  const { active: isActive, canUndo, canRedo, editable } = snapshot.value
  const enabled = editable && !props.disabled

  return [
    [
      {
        id: 'undo',
        label: props.labels.undo,
        icon: 'undo',
        disabled: !enabled || !canUndo,
        action: () => chain().undo().run(),
      },
      {
        id: 'redo',
        label: props.labels.redo,
        icon: 'redo',
        disabled: !enabled || !canRedo,
        action: () => chain().redo().run(),
      },
      {
        id: 'format-painter',
        label: props.labels.formatPainter,
        icon: 'format-painter',
        toggle: true,
        active: painterActive.value,
        disabled: !enabled,
        action: toggleFormatPainter,
      },
    ],
    [
      {
        id: 'block',
        label: props.labels.paragraphStyle,
        disabled: !enabled,
      },
      {
        id: 'font',
        label: props.labels.fontFamily,
        disabled: !enabled,
      },
      {
        id: 'size',
        label: props.labels.fontSize,
        disabled: !enabled,
      },
      {
        id: 'bold',
        label: props.labels.bold,
        text: 'B',
        textClass: 'is-bold',
        toggle: true,
        active: isActive.bold,
        disabled: !enabled,
        action: () => chain().toggleBold().run(),
      },
      {
        id: 'italic',
        label: props.labels.italic,
        text: 'I',
        textClass: 'is-italic',
        toggle: true,
        active: isActive.italic,
        disabled: !enabled,
        action: () => chain().toggleItalic().run(),
      },
      {
        id: 'underline',
        label: props.labels.underline,
        text: 'U',
        textClass: 'is-underline',
        toggle: true,
        active: isActive.underline,
        disabled: !enabled,
        action: () => chain().toggleUnderline().run(),
      },
      {
        id: 'strike',
        label: props.labels.strike,
        text: 'S',
        textClass: 'is-strike',
        toggle: true,
        active: isActive.strike,
        disabled: !enabled,
        action: () => chain().toggleStrike().run(),
      },
      {
        id: 'code',
        label: props.labels.code,
        text: '</>',
        textClass: 'is-code',
        toggle: true,
        active: isActive.code,
        disabled: !enabled,
        action: () => chain().toggleCode().run(),
      },
      {
        id: 'subscript',
        label: props.labels.subscript,
        text: 'X₂',
        textClass: 'is-subscript',
        toggle: true,
        active: isActive.subscript,
        disabled: !enabled,
        action: () => chain().toggleSubscript().run(),
      },
      {
        id: 'superscript',
        label: props.labels.superscript,
        text: 'X²',
        textClass: 'is-superscript',
        toggle: true,
        active: isActive.superscript,
        disabled: !enabled,
        action: () => chain().toggleSuperscript().run(),
      },
      {
        id: 'highlight',
        label: props.labels.highlight,
        icon: 'highlight',
        toggle: true,
        active: isActive.highlight,
        disabled: !enabled,
        action: () => chain().toggleHighlight().run(),
      },
      {
        id: 'color',
        label: props.labels.color,
        text: 'A',
        textClass: 'is-color',
        disabled: !enabled,
        action: openColorPicker,
      },
    ],
    [
      {
        id: 'bullet-list',
        label: props.labels.bulletList,
        icon: 'bullet-list',
        toggle: true,
        active: isActive.bulletList,
        disabled: !enabled,
        action: () => chain().toggleBulletList().run(),
      },
      {
        id: 'ordered-list',
        label: props.labels.orderedList,
        icon: 'ordered-list',
        toggle: true,
        active: isActive.orderedList,
        disabled: !enabled,
        action: () => chain().toggleOrderedList().run(),
      },
      {
        id: 'task-list',
        label: props.labels.taskList,
        icon: 'task-list',
        toggle: true,
        active: isActive.taskList,
        disabled: !enabled,
        action: () => chain().toggleTaskList().run(),
      },
    ],
    [
      {
        id: 'blockquote',
        label: props.labels.blockquote,
        text: '“',
        textClass: 'is-quote',
        toggle: true,
        active: isActive.blockquote,
        disabled: !enabled,
        action: () => chain().toggleBlockquote().run(),
      },
      {
        id: 'code-block',
        label: props.labels.codeBlock,
        icon: 'code-block',
        toggle: true,
        active: isActive.codeBlock,
        disabled: !enabled,
        action: () => chain().toggleCodeBlock().run(),
      },
      {
        id: 'horizontal-rule',
        label: props.labels.horizontalRule,
        icon: 'horizontal-rule',
        disabled: !enabled,
        action: () => chain().setHorizontalRule().run(),
      },
    ],
    [
      {
        id: 'link',
        label: props.labels.link,
        icon: 'link',
        toggle: true,
        active: isActive.link,
        disabled: !enabled,
        action: toggleLink,
      },
      {
        id: 'image',
        label: props.labels.image,
        icon: 'image',
        disabled: !enabled,
        action: () => togglePopover('image'),
      },
      {
        id: 'video',
        label: props.labels.video,
        icon: 'video',
        disabled: !enabled,
        action: toggleVideoForm,
      },
      {
        id: 'attachment',
        label: props.labels.attachment,
        icon: 'attachment',
        disabled: !enabled,
        action: toggleAttachmentForm,
      },
      {
        id: 'table',
        label: props.labels.insertTable,
        icon: 'table',
        disabled: !enabled,
        action: openTablePicker,
      },
      {
        id: 'emoji',
        label: props.labels.emoji,
        icon: 'emoji',
        disabled: !enabled,
        action: () => togglePopover('emoji'),
      },
    ],
    [
      {
        id: 'outdent',
        label: props.labels.outdent,
        icon: 'outdent',
        disabled: !enabled,
        action: () => chain().decreaseIndent().run(),
      },
      {
        id: 'indent',
        label: props.labels.indent,
        icon: 'indent',
        disabled: !enabled,
        action: () => chain().increaseIndent().run(),
      },
      {
        id: 'align-left',
        label: props.labels.alignLeft,
        icon: 'align-left',
        toggle: true,
        active: isActive.alignLeft,
        disabled: !enabled,
        action: () => chain().setTextAlign('left').run(),
      },
      {
        id: 'align-center',
        label: props.labels.alignCenter,
        icon: 'align-center',
        toggle: true,
        active: isActive.alignCenter,
        disabled: !enabled,
        action: () => chain().setTextAlign('center').run(),
      },
      {
        id: 'align-right',
        label: props.labels.alignRight,
        icon: 'align-right',
        toggle: true,
        active: isActive.alignRight,
        disabled: !enabled,
        action: () => chain().setTextAlign('right').run(),
      },
    ],
    [
      {
        id: 'preview',
        label: props.labels.preview,
        icon: 'preview',
        toggle: true,
        active: props.preview,
        disabled: !enabled,
        action: () => emit('toggle-preview'),
      },
      {
        id: 'print',
        label: props.labels.print,
        icon: 'print',
        disabled: !enabled,
        action: printContent,
      },
      ...(props.allowFullscreen
        ? [
            {
              id: 'fullscreen',
              label: props.fullscreen ? props.labels.exitFullscreen : props.labels.fullscreen,
              icon: props.fullscreen ? ('fullscreen-exit' as const) : ('fullscreen' as const),
              toggle: true,
              active: props.fullscreen,
              disabled: !enabled,
              action: () => emit('toggle-fullscreen'),
            },
          ]
        : []),
      {
        id: 'clear-formatting',
        label: props.labels.clearFormatting,
        icon: 'clear-formatting',
        disabled: !enabled,
        action: () => chain().unsetAllMarks().clearNodes().run(),
      },
      {
        id: 'ai',
        label: props.labels.ai,
        text: 'AI',
        textClass: 'is-ai',
        toggle: true,
        active: popover.value === 'ai',
        disabled: !enabled,
        action: toggleAiForm,
      },
    ],
  ]
})

const flatItems = computed(() => groups.value.flat())

const tabbableId = computed(() => {
  const flat = flatItems.value
  if (flat.some((item) => item.id === activeToolId.value && !item.disabled)) {
    return activeToolId.value
  }
  return flat.find((item) => !item.disabled)?.id ?? flat[0]?.id ?? ''
})
</script>

<template>
  <div
    ref="toolbarRef"
    class="w-tiptap-editor__toolbar"
    role="toolbar"
    :aria-label="labels.toolbar"
    @keydown="onToolbarKeydown"
  >
    <div v-for="(group, index) in groups" :key="index" class="w-tiptap-editor__group">
      <template v-for="item in group" :key="item.id">
        <select
          v-if="item.id === 'block'"
          class="w-tiptap-editor__font-select w-tiptap-editor__block-select"
          data-tool-id="block"
          :tabindex="item.id === tabbableId ? 0 : -1"
          :aria-label="item.label"
          :title="item.label"
          :value="currentBlock"
          :disabled="item.disabled"
          @focus="activeToolId = item.id"
          @change="handleBlockChange"
        >
          <option v-for="option in BLOCK_OPTIONS" :key="option.value" :value="option.value">
            {{ labels[option.label] }}
          </option>
        </select>
        <select
          v-else-if="item.id === 'font'"
          class="w-tiptap-editor__font-select"
          data-tool-id="font"
          :tabindex="item.id === tabbableId ? 0 : -1"
          :aria-label="item.label"
          :title="item.label"
          :value="currentFontFamily"
          :disabled="item.disabled"
          @focus="activeToolId = item.id"
          @change="handleFontChange"
        >
          <option
            v-for="font in TIPTAP_FONT_FAMILIES"
            :key="font.label"
            :value="font.value"
            :style="font.value ? { fontFamily: font.value } : undefined"
          >
            {{ font.label }}
          </option>
        </select>
        <select
          v-else-if="item.id === 'size'"
          class="w-tiptap-editor__font-select w-tiptap-editor__size-select"
          data-tool-id="size"
          :tabindex="item.id === tabbableId ? 0 : -1"
          :aria-label="item.label"
          :title="item.label"
          :value="currentFontSize"
          :disabled="item.disabled"
          @focus="activeToolId = item.id"
          @change="handleFontSizeChange"
        >
          <option value="">{{ labels.defaultSize }}</option>
          <option v-for="size in FONT_SIZES" :key="size" :value="size">
            {{ size.replace('px', '') }}
          </option>
        </select>
        <span
          v-else-if="item.id === 'table'"
          class="w-tiptap-editor__table-trigger"
          @pointerenter="openTablePicker"
          @pointerleave="closeTablePicker"
        >
          <button
            type="button"
            class="w-tiptap-editor__tool"
            data-tool-id="table"
            :tabindex="item.id === tabbableId ? 0 : -1"
            :aria-label="item.label"
            v-tooltip="item.label"
            aria-haspopup="true"
            :aria-expanded="popover === 'table'"
            :disabled="item.disabled"
            @focus="activeToolId = item.id"
            @click="openTablePicker"
          >
            <ToolbarIcon name="table" />
          </button>

          <div
            v-if="popover === 'table'"
            class="w-tiptap-editor__table-picker"
            :class="{ 'is-align-right': tablePickerAlign === 'right' }"
            role="group"
            :aria-label="labels.insertTablePanel"
          >
            <div class="w-tiptap-editor__table-picker-head">
              <span>{{ labels.insertTablePanel }}</span>
              <span class="w-tiptap-editor__table-picker-size">{{ tableSizeLabel }}</span>
            </div>
            <div class="w-tiptap-editor__table-picker-grid">
              <button
                v-for="cell in tablePickerCells"
                :key="`${cell.row}-${cell.col}`"
                type="button"
                class="w-tiptap-editor__table-picker-cell"
                :class="{
                  'is-active': cell.row <= tablePickerRows && cell.col <= tablePickerCols,
                }"
                :data-rows="cell.row"
                :data-cols="cell.col"
                :aria-label="`${cell.row} × ${cell.col}`"
                @pointerenter="previewTableSize(cell.row, cell.col)"
                @focus="previewTableSize(cell.row, cell.col)"
                @click="insertTable(cell.row, cell.col)"
              />
            </div>
          </div>
        </span>
        <span v-else-if="item.id === 'emoji'" class="w-tiptap-editor__popover-trigger">
          <button
            type="button"
            class="w-tiptap-editor__tool"
            data-tool-id="emoji"
            :tabindex="item.id === tabbableId ? 0 : -1"
            :aria-label="item.label"
            v-tooltip="item.label"
            :aria-expanded="popover === 'emoji'"
            :disabled="item.disabled"
            @focus="activeToolId = item.id"
            @click="item.action"
          >
            <ToolbarIcon name="emoji" />
          </button>

          <div
            v-if="popover === 'emoji'"
            class="w-tiptap-editor__emoji-panel"
            role="group"
            :aria-label="labels.emoji"
          >
            <button
              v-for="emoji in EMOJIS"
              :key="emoji"
              type="button"
              class="w-tiptap-editor__emoji"
              :aria-label="emoji"
              @click="insertEmoji(emoji)"
            >
              {{ emoji }}
            </button>
          </div>
        </span>
        <button
          v-else
          type="button"
          class="w-tiptap-editor__tool"
          :class="[item.textClass, { 'is-active': item.active }]"
          :data-tool-id="item.id"
          :tabindex="item.id === tabbableId ? 0 : -1"
          :aria-label="item.label"
          v-tooltip="item.label"
          :aria-pressed="item.toggle ? item.active : undefined"
          :disabled="item.disabled"
          @focus="activeToolId = item.id"
          @click="runTool(item)"
        >
          <ToolbarIcon v-if="item.icon" :name="item.icon" />
          <span
            v-else-if="item.id === 'color'"
            class="w-tiptap-editor__glyph w-tiptap-editor__color-glyph"
            :style="{ '--w-tiptap-editor-current-color': currentColor }"
            aria-hidden="true"
          >
            {{ item.text }}
          </span>
          <span v-else class="w-tiptap-editor__glyph" aria-hidden="true">{{ item.text }}</span>
        </button>
      </template>
    </div>

    <input
      ref="colorInput"
      class="w-tiptap-editor__color-input"
      type="color"
      tabindex="-1"
      aria-hidden="true"
      :value="currentColor"
      @input="applyColor"
    />

    <form v-if="popover === 'link'" class="w-tiptap-editor__link-form" @submit.prevent="applyLink">
      <input
        ref="linkInput"
        v-model="linkValue"
        class="w-tiptap-editor__link-input"
        type="text"
        inputmode="url"
        :placeholder="labels.linkPlaceholder"
        :aria-label="labels.linkPlaceholder"
        @keydown.esc.prevent="closePopover"
      />
      <button type="submit" class="w-tiptap-editor__link-action">
        {{ labels.linkApply }}
      </button>
      <button
        type="button"
        class="w-tiptap-editor__link-action"
        :aria-label="labels.linkCancel"
        @click="closePopover"
      >
        {{ labels.linkCancel }}
      </button>
    </form>

    <form
      v-else-if="popover === 'video'"
      class="w-tiptap-editor__link-form"
      @submit.prevent="applyVideo"
    >
      <input
        v-model="videoUrl"
        class="w-tiptap-editor__link-input"
        type="text"
        inputmode="url"
        :placeholder="labels.videoPlaceholder"
        :aria-label="labels.videoPlaceholder"
        @keydown.esc.prevent="closePopover"
      />
      <button type="submit" class="w-tiptap-editor__link-action">
        {{ labels.videoApply }}
      </button>
      <button
        type="button"
        class="w-tiptap-editor__link-action"
        :aria-label="labels.videoCancel"
        @click="closePopover"
      >
        {{ labels.videoCancel }}
      </button>
    </form>

    <form
      v-else-if="popover === 'attachment'"
      class="w-tiptap-editor__link-form"
      @submit.prevent="applyAttachment"
    >
      <input
        v-model="attachmentUrl"
        class="w-tiptap-editor__link-input"
        type="text"
        inputmode="url"
        :placeholder="labels.attachmentUrlPlaceholder"
        :aria-label="labels.attachmentUrlPlaceholder"
        @keydown.esc.prevent="closePopover"
      />
      <input
        v-model="attachmentName"
        class="w-tiptap-editor__link-input"
        type="text"
        :placeholder="labels.attachmentNamePlaceholder"
        :aria-label="labels.attachmentNamePlaceholder"
        @keydown.esc.prevent="closePopover"
      />
      <button type="submit" class="w-tiptap-editor__link-action">
        {{ labels.attachmentApply }}
      </button>
      <button
        type="button"
        class="w-tiptap-editor__link-action"
        :aria-label="labels.attachmentCancel"
        @click="closePopover"
      >
        {{ labels.attachmentCancel }}
      </button>
    </form>

    <form v-else-if="popover === 'ai'" class="w-tiptap-editor__link-form" @submit.prevent="applyAi">
      <input
        v-model="aiPrompt"
        class="w-tiptap-editor__link-input"
        type="text"
        :placeholder="labels.aiPlaceholder"
        :aria-label="labels.aiPlaceholder"
        @keydown.esc.prevent="closePopover"
      />
      <button type="submit" class="w-tiptap-editor__link-action">
        {{ labels.aiApply }}
      </button>
      <button
        type="button"
        class="w-tiptap-editor__link-action"
        :aria-label="labels.aiCancel"
        @click="closePopover"
      >
        {{ labels.aiCancel }}
      </button>
    </form>

    <ImageForm
      v-else-if="popover === 'image'"
      :editor="editor"
      :labels="labels"
      :upload-image="uploadImage"
      :accept="imageAccept"
      @close="closePopover"
      @error="handleImageError"
    />
  </div>
</template>
