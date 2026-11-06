<script setup lang="ts">
import type { Editor } from '@tiptap/core'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { TiptapEditorImageUpload, TiptapEditorLabels } from './types'

const props = defineProps<{
  editor: Editor
  labels: TiptapEditorLabels
  uploadImage: TiptapEditorImageUpload
  accept: string
}>()

const emit = defineEmits<{
  close: []
  error: [error: Error, file: File | null]
}>()

const fileInput = ref<HTMLInputElement>()
const urlInput = ref<HTMLInputElement>()
const url = ref('')
const uploading = ref(false)
const message = ref('')
let cancelled = false

function insertImage(src: string, alt = '') {
  if (cancelled || props.editor.isDestroyed) return
  props.editor.chain().focus().setImage({ src, alt }).run()
}

function normalizeUrl(value: string): string {
  return /^(https?:|data:|blob:|\/|\.\/|\.\.\/)/i.test(value) ? value : `https://${value}`
}

function openFilePicker() {
  fileInput.value?.click()
}

async function handleFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  uploading.value = true
  message.value = ''
  try {
    const src = await props.uploadImage(file)
    if (cancelled) return
    insertImage(src, file.name)
    emit('close')
  } catch (cause) {
    if (cancelled) return
    const error = cause instanceof Error ? cause : new Error(String(cause))
    message.value = error.message || props.labels.imageUploadFailed
    emit('error', error, file)
  } finally {
    uploading.value = false
  }
}

function applyUrl() {
  const value = url.value.trim()
  if (!value) {
    urlInput.value?.focus()
    return
  }

  insertImage(normalizeUrl(value))
  emit('close')
}

onMounted(() => {
  nextTick(() => urlInput.value?.focus())
})

onBeforeUnmount(() => {
  cancelled = true
})
</script>

<template>
  <form class="w-tiptap-editor__popover" @submit.prevent="applyUrl">
    <div class="w-tiptap-editor__popover-row">
      <input
        ref="fileInput"
        class="w-tiptap-editor__file-input"
        type="file"
        :accept="accept"
        tabindex="-1"
        @change="handleFile"
      />
      <button
        type="button"
        class="w-tiptap-editor__link-action"
        :disabled="uploading"
        @click="openFilePicker"
      >
        {{ uploading ? labels.imageUploading : labels.imageUpload }}
      </button>
      <span class="w-tiptap-editor__hint">{{ labels.imageHint }}</span>
    </div>

    <div class="w-tiptap-editor__popover-row">
      <input
        ref="urlInput"
        v-model="url"
        class="w-tiptap-editor__link-input"
        type="text"
        inputmode="url"
        :placeholder="labels.imageUrlPlaceholder"
        :aria-label="labels.imageUrlPlaceholder"
        @keydown.esc.prevent="emit('close')"
      />
      <button type="submit" class="w-tiptap-editor__link-action">
        {{ labels.imageApply }}
      </button>
      <button
        type="button"
        class="w-tiptap-editor__link-action"
        :aria-label="labels.imageCancel"
        @click="emit('close')"
      >
        {{ labels.imageCancel }}
      </button>
    </div>

    <p v-if="message" class="w-tiptap-editor__error" role="alert">{{ message }}</p>
  </form>
</template>
