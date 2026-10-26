<script setup lang="ts">
import type { Editor } from '@tiptap/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { TiptapEditorLabels } from './types'

defineOptions({ name: 'WTiptapEditorTableMenu' })

const props = defineProps<{
  editor: Editor
  labels: TiptapEditorLabels
}>()

const emit = defineEmits<{ close: [] }>()

const revision = ref(0)
const menuRef = ref<HTMLElement>()

interface TableAction {
  id: string
  label: string
  disabled?: boolean
  action: () => void
}

function refresh(): void {
  revision.value += 1
}

function menuItems(): HTMLButtonElement[] {
  return Array.from(
    menuRef.value?.querySelectorAll<HTMLButtonElement>(
      '.w-tiptap-editor__menu-item:not(:disabled)',
    ) ?? [],
  )
}

function onMenuKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }

  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return

  const items = menuItems()
  if (!items.length) return

  event.preventDefault()
  const current = items.indexOf(document.activeElement as HTMLButtonElement)
  let next = 0

  if (event.key === 'End') {
    next = items.length - 1
  } else if (event.key === 'ArrowDown') {
    next = (current + 1 + items.length) % items.length
  } else if (event.key === 'ArrowUp') {
    next = (current - 1 + items.length) % items.length
  }

  items[next]?.focus()
}

onMounted(() => {
  props.editor.on('transaction', refresh)
  props.editor.on('selectionUpdate', refresh)
  void nextTick(() => menuItems()[0]?.focus())
})

onBeforeUnmount(() => {
  props.editor.off('transaction', refresh)
  props.editor.off('selectionUpdate', refresh)
})

function run(action: () => boolean): void {
  action()
  emit('close')
}

const inserted = computed(() => {
  void revision.value
  return props.editor.isActive('table')
})

const insertActions = computed<TableAction[]>(() => [
  {
    id: 'insert-table',
    label: props.labels.insertTable,
    action: () =>
      run(() =>
        props.editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      ),
  },
])

const tableActions = computed<TableAction[]>(() => {
  void revision.value
  const editor = props.editor
  return [
    {
      id: 'add-row-before',
      label: props.labels.addRowBefore,
      disabled: !editor.can().addRowBefore(),
      action: () => run(() => editor.chain().focus().addRowBefore().run()),
    },
    {
      id: 'add-row-after',
      label: props.labels.addRowAfter,
      disabled: !editor.can().addRowAfter(),
      action: () => run(() => editor.chain().focus().addRowAfter().run()),
    },
    {
      id: 'delete-row',
      label: props.labels.deleteRow,
      disabled: !editor.can().deleteRow(),
      action: () => run(() => editor.chain().focus().deleteRow().run()),
    },
    {
      id: 'add-column-before',
      label: props.labels.addColumnBefore,
      disabled: !editor.can().addColumnBefore(),
      action: () => run(() => editor.chain().focus().addColumnBefore().run()),
    },
    {
      id: 'add-column-after',
      label: props.labels.addColumnAfter,
      disabled: !editor.can().addColumnAfter(),
      action: () => run(() => editor.chain().focus().addColumnAfter().run()),
    },
    {
      id: 'delete-column',
      label: props.labels.deleteColumn,
      disabled: !editor.can().deleteColumn(),
      action: () => run(() => editor.chain().focus().deleteColumn().run()),
    },
    {
      id: 'toggle-header-row',
      label: props.labels.toggleHeaderRow,
      action: () => run(() => editor.chain().focus().toggleHeaderRow().run()),
    },
    {
      id: 'delete-table',
      label: props.labels.deleteTable,
      disabled: !editor.can().deleteTable(),
      action: () => run(() => editor.chain().focus().deleteTable().run()),
    },
  ]
})
</script>

<template>
  <div
    ref="menuRef"
    class="w-tiptap-editor__menu"
    role="menu"
    :aria-label="labels.table"
    @keydown="onMenuKeydown"
  >
    <div class="w-tiptap-editor__menu-group">
      <button
        v-for="action in insertActions"
        :key="action.id"
        type="button"
        role="menuitem"
        tabindex="-1"
        class="w-tiptap-editor__menu-item"
        @click="action.action"
      >
        {{ action.label }}
      </button>
    </div>

    <div v-if="inserted" class="w-tiptap-editor__menu-group">
      <button
        v-for="action in tableActions"
        :key="action.id"
        type="button"
        role="menuitem"
        tabindex="-1"
        class="w-tiptap-editor__menu-item"
        :disabled="action.disabled"
        @click="action.action"
      >
        {{ action.label }}
      </button>
    </div>
  </div>
</template>
