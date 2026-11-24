<script setup lang="ts">
import type { Extensions } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { watch } from 'vue'
import { createTiptapExtensions } from './extensions'

const props = defineProps<{
  content: string
  label: string
  extensions?: Extensions
}>()

const editor = useEditor({
  content: props.content,
  editable: false,
  extensions: createTiptapExtensions(() => '', props.extensions),
  editorProps: {
    attributes: {
      class: 'w-tiptap-editor__prosemirror',
      role: 'document',
      'aria-label': props.label,
      'aria-readonly': 'true',
    },
  },
})

watch(
  () => props.content,
  (content) => {
    const instance = editor.value
    if (!instance || content === instance.getHTML()) return
    instance.commands.setContent(content, { emitUpdate: false })
  },
)
</script>

<template>
  <EditorContent :editor="editor" />
</template>
