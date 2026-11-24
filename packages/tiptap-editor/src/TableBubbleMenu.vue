<script setup lang="ts">
import type { Editor } from '@tiptap/core'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { TiptapEditorLabels } from './types'

const props = defineProps<{
  editor: Editor
  labels: TiptapEditorLabels
}>()

const revision = ref(0)

function refresh() {
  revision.value += 1
}

onMounted(() => {
  props.editor.on('transaction', refresh)
  props.editor.on('selectionUpdate', refresh)
})

onBeforeUnmount(() => {
  props.editor.off('transaction', refresh)
  props.editor.off('selectionUpdate', refresh)
})

interface TableAction {
  id: string
  label: string
  disabled?: boolean
  action: () => void
}

const actions = computed<TableAction[]>(() => {
  void revision.value
  const editor = props.editor

  return [
    {
      id: 'add-row-before',
      label: props.labels.addRowBefore,
      disabled: !editor.can().addRowBefore(),
      action: () => editor.chain().focus().addRowBefore().run(),
    },
    {
      id: 'add-row-after',
      label: props.labels.addRowAfter,
      disabled: !editor.can().addRowAfter(),
      action: () => editor.chain().focus().addRowAfter().run(),
    },
    {
      id: 'delete-row',
      label: props.labels.deleteRow,
      disabled: !editor.can().deleteRow(),
      action: () => editor.chain().focus().deleteRow().run(),
    },
    {
      id: 'add-column-before',
      label: props.labels.addColumnBefore,
      disabled: !editor.can().addColumnBefore(),
      action: () => editor.chain().focus().addColumnBefore().run(),
    },
    {
      id: 'add-column-after',
      label: props.labels.addColumnAfter,
      disabled: !editor.can().addColumnAfter(),
      action: () => editor.chain().focus().addColumnAfter().run(),
    },
    {
      id: 'delete-column',
      label: props.labels.deleteColumn,
      disabled: !editor.can().deleteColumn(),
      action: () => editor.chain().focus().deleteColumn().run(),
    },
    {
      id: 'toggle-header-row',
      label: props.labels.toggleHeaderRow,
      action: () => editor.chain().focus().toggleHeaderRow().run(),
    },
    {
      id: 'delete-table',
      label: props.labels.deleteTable,
      disabled: !editor.can().deleteTable(),
      action: () => editor.chain().focus().deleteTable().run(),
    },
  ]
})

function shouldShow() {
  return props.editor.isActive('table')
}

/**
 * The editor clips its content, so the menu must live in `body` instead of the
 * editor subtree; otherwise it is cut off at the editor edges.
 */
function appendToBody(): HTMLElement {
  return document.body
}
</script>

<template>
  <BubbleMenu
    :editor="editor"
    :should-show="shouldShow"
    :append-to="appendToBody"
    :options="{
      placement: 'bottom-start',
      offset: 8,
      flip: { fallbackPlacements: ['top-start'] },
      shift: { padding: 8 },
    }"
  >
    <div class="w-tiptap-editor__table-menu" role="menu" :aria-label="labels.table">
      <button
        v-for="action in actions"
        :key="action.id"
        type="button"
        role="menuitem"
        class="w-tiptap-editor__table-menu-item"
        :disabled="action.disabled"
        @click="action.action"
      >
        {{ action.label }}
      </button>
    </div>
  </BubbleMenu>
</template>
