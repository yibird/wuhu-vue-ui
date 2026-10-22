<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { triggerDownload } from '../core/download'
import { formatBytes } from '../core/format'
import { defaultCapabilities } from '../core/capabilities'
import type { FileViewerRendererProps } from '../types'

defineOptions({
  name: 'WFileViewerUnsupportedRenderer',
})

const props = defineProps<FileViewerRendererProps>()

const emit = defineEmits<{
  ready: [
    payload: {
      pageCount: number
      capabilities: { zoom: boolean; rotate: boolean; paged: boolean; print: boolean }
    },
  ]
}>()

const downloading = ref(false)
const error = ref('')

async function download(): Promise<void> {
  downloading.value = true
  error.value = ''
  try {
    triggerDownload(await props.source.getBlob(), props.source.name)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : props.messages.viewer.downloadFailed
  } finally {
    downloading.value = false
  }
}

onMounted(() => {
  emit('ready', {
    pageCount: 0,
    capabilities: defaultCapabilities(props.kind),
  })
})
</script>

<template>
  <div class="w-file-viewer__placeholder">
    <div class="w-file-viewer__placeholder-icon" aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <path
          d="M13 5h14l8 8v30H13V5Z"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linejoin="round"
        />
        <path d="M27 5v9h8" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
        <path
          d="M18 27h12M18 33h8"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      </svg>
    </div>
    <h3>{{ messages.renderers.unsupported.title }}</h3>
    <p>{{ messages.renderers.unsupported.description }}</p>
    <p class="w-file-viewer__placeholder-hint">{{ messages.renderers.unsupported.hint }}</p>
    <dl class="w-file-viewer__placeholder-meta">
      <div>
        <dt>{{ messages.viewer.name }}</dt>
        <dd>{{ source.name }}</dd>
      </div>
      <div>
        <dt>{{ messages.viewer.format }}</dt>
        <dd>{{ source.extension ? source.extension.toUpperCase() : messages.viewer.unknown }}</dd>
      </div>
      <div v-if="source.size !== undefined">
        <dt>{{ messages.viewer.size }}</dt>
        <dd>{{ formatBytes(source.size, locale) }}</dd>
      </div>
    </dl>
    <button
      type="button"
      class="w-file-viewer__button is-primary"
      :disabled="downloading"
      @click="download"
    >
      {{ messages.viewer.download }}
    </button>
    <p v-if="error" class="w-file-viewer__inline-error">{{ error }}</p>
  </div>
</template>
