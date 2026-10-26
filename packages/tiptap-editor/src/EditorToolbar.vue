<script setup lang="ts">
import type { Editor } from '@tiptap/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import ImageForm from './ImageForm.vue'
import TableMenu from './TableMenu.vue'
import ToolbarIcon from './ToolbarIcon.vue'
import type { ToolbarIconName } from './icons'
import type { TiptapEditorImageUpload, TiptapEditorLabels } from './types'

defineOptions({ name: 'WTiptapEditorToolbar' })

const props = defineProps<{
  editor: Editor
  labels: TiptapEditorLabels
  disabled?: boolean
  uploadImage: TiptapEditorImageUpload
  imageAccept: string
  fullscreen?: boolean
  allowFullscreen?: boolean
}>()

const emit = defineEmits<{
  error: [error: Error, file: File | null]
  'toggle-fullscreen': []
}>()

function handleImageError(error: Error, file: File | null): void {
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
  action: () => void
}

type Popover = 'link' | 'image' | 'table' | null

const revision = ref(0)
const popover = ref<Popover>(null)
const linkValue = ref('')
const linkInput = ref<HTMLInputElement>()
const colorInput = ref<HTMLInputElement>()
const toolbarRef = ref<HTMLElement>()
const activeToolId = ref('')
let revisionScheduled = false

/** Coalesce the transaction + selectionUpdate pair into one recompute. */
function refresh(): void {
  if (revisionScheduled) return
  revisionScheduled = true
  queueMicrotask(() => {
    revisionScheduled = false
    revision.value += 1
  })
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (!popover.value) return
  const target = event.target as Node | null
  if (target && toolbarRef.value?.contains(target)) return
  // Outside clicks dismiss the panel without stealing focus from the target.
  popover.value = null
}

function onDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && popover.value) {
    popover.value = null
  }
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
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  window.removeEventListener('keydown', onDocumentKeydown)
})

function chain() {
  return props.editor.chain().focus()
}

function closePopover(): void {
  popover.value = null
  chain().run()
}

function togglePopover(next: Exclude<Popover, null>): void {
  popover.value = popover.value === next ? null : next
}

function focusTool(id: string): void {
  activeToolId.value = id
  void nextTick(() => {
    toolbarRef.value?.querySelector<HTMLButtonElement>(`[data-tool-id="${id}"]`)?.focus()
  })
}

function onToolbarKeydown(event: KeyboardEvent): void {
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

function toggleLink(): void {
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

function applyLink(): void {
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

const currentColor = computed(() => {
  void revision.value
  const color = props.editor.getAttributes('textStyle').color
  return typeof color === 'string' && color ? color : '#0f172a'
})

function openColorPicker(): void {
  colorInput.value?.click()
}

function applyColor(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  chain().setColor(value).run()
}

const groups = computed<ToolbarItem[][]>(() => {
  void revision.value
  const editor = props.editor
  const enabled = editor.isEditable && !props.disabled

  return [
    [
      {
        id: 'undo',
        label: props.labels.undo,
        icon: 'undo',
        disabled: !enabled || !editor.can().undo(),
        action: () => chain().undo().run(),
      },
      {
        id: 'redo',
        label: props.labels.redo,
        icon: 'redo',
        disabled: !enabled || !editor.can().redo(),
        action: () => chain().redo().run(),
      },
    ],
    [
      {
        id: 'bold',
        label: props.labels.bold,
        text: 'B',
        textClass: 'is-bold',
        toggle: true,
        active: editor.isActive('bold'),
        disabled: !enabled,
        action: () => chain().toggleBold().run(),
      },
      {
        id: 'italic',
        label: props.labels.italic,
        text: 'I',
        textClass: 'is-italic',
        toggle: true,
        active: editor.isActive('italic'),
        disabled: !enabled,
        action: () => chain().toggleItalic().run(),
      },
      {
        id: 'underline',
        label: props.labels.underline,
        text: 'U',
        textClass: 'is-underline',
        toggle: true,
        active: editor.isActive('underline'),
        disabled: !enabled,
        action: () => chain().toggleUnderline().run(),
      },
      {
        id: 'strike',
        label: props.labels.strike,
        text: 'S',
        textClass: 'is-strike',
        toggle: true,
        active: editor.isActive('strike'),
        disabled: !enabled,
        action: () => chain().toggleStrike().run(),
      },
      {
        id: 'code',
        label: props.labels.code,
        text: '</>',
        textClass: 'is-code',
        toggle: true,
        active: editor.isActive('code'),
        disabled: !enabled,
        action: () => chain().toggleCode().run(),
      },
      {
        id: 'highlight',
        label: props.labels.highlight,
        icon: 'highlight',
        toggle: true,
        active: editor.isActive('highlight'),
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
        id: 'heading-1',
        label: props.labels.heading1,
        text: 'H1',
        toggle: true,
        active: editor.isActive('heading', { level: 1 }),
        disabled: !enabled,
        action: () => chain().toggleHeading({ level: 1 }).run(),
      },
      {
        id: 'heading-2',
        label: props.labels.heading2,
        text: 'H2',
        toggle: true,
        active: editor.isActive('heading', { level: 2 }),
        disabled: !enabled,
        action: () => chain().toggleHeading({ level: 2 }).run(),
      },
      {
        id: 'heading-3',
        label: props.labels.heading3,
        text: 'H3',
        toggle: true,
        active: editor.isActive('heading', { level: 3 }),
        disabled: !enabled,
        action: () => chain().toggleHeading({ level: 3 }).run(),
      },
    ],
    [
      {
        id: 'bullet-list',
        label: props.labels.bulletList,
        icon: 'bullet-list',
        toggle: true,
        active: editor.isActive('bulletList'),
        disabled: !enabled,
        action: () => chain().toggleBulletList().run(),
      },
      {
        id: 'ordered-list',
        label: props.labels.orderedList,
        icon: 'ordered-list',
        toggle: true,
        active: editor.isActive('orderedList'),
        disabled: !enabled,
        action: () => chain().toggleOrderedList().run(),
      },
      {
        id: 'task-list',
        label: props.labels.taskList,
        icon: 'task-list',
        toggle: true,
        active: editor.isActive('taskList'),
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
        active: editor.isActive('blockquote'),
        disabled: !enabled,
        action: () => chain().toggleBlockquote().run(),
      },
      {
        id: 'code-block',
        label: props.labels.codeBlock,
        icon: 'code-block',
        toggle: true,
        active: editor.isActive('codeBlock'),
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
        active: editor.isActive('link'),
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
        id: 'table',
        label: props.labels.table,
        icon: 'table',
        toggle: true,
        active: editor.isActive('table'),
        disabled: !enabled,
        action: () => togglePopover('table'),
      },
    ],
    [
      {
        id: 'align-left',
        label: props.labels.alignLeft,
        icon: 'align-left',
        toggle: true,
        active: editor.isActive({ textAlign: 'left' }),
        disabled: !enabled,
        action: () => chain().setTextAlign('left').run(),
      },
      {
        id: 'align-center',
        label: props.labels.alignCenter,
        icon: 'align-center',
        toggle: true,
        active: editor.isActive({ textAlign: 'center' }),
        disabled: !enabled,
        action: () => chain().setTextAlign('center').run(),
      },
      {
        id: 'align-right',
        label: props.labels.alignRight,
        icon: 'align-right',
        toggle: true,
        active: editor.isActive({ textAlign: 'right' }),
        disabled: !enabled,
        action: () => chain().setTextAlign('right').run(),
      },
    ],
    [
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
      <button
        v-for="item in group"
        :key="item.id"
        type="button"
        class="w-tiptap-editor__tool"
        :class="[item.textClass, { 'is-active': item.active }]"
        :data-tool-id="item.id"
        :tabindex="item.id === tabbableId ? 0 : -1"
        :aria-label="item.label"
        :title="item.label"
        :aria-pressed="item.toggle ? item.active : undefined"
        :disabled="item.disabled"
        @focus="activeToolId = item.id"
        @click="item.action"
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

    <ImageForm
      v-else-if="popover === 'image'"
      :editor="editor"
      :labels="labels"
      :upload-image="uploadImage"
      :accept="imageAccept"
      @close="closePopover"
      @error="handleImageError"
    />

    <TableMenu
      v-else-if="popover === 'table'"
      :editor="editor"
      :labels="labels"
      @close="closePopover"
    />
  </div>
</template>
