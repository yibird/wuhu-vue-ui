<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { formatBytes } from '../core/format'
import { defaultCapabilities } from '../core/capabilities'
import type { FileViewerRendererProps } from '../types'

const props = defineProps<FileViewerRendererProps>()

const emit = defineEmits<{
  ready: [
    payload: {
      pageCount: number
      capabilities: { zoom: boolean; rotate: boolean; paged: boolean; print: boolean }
    },
  ]
  error: [error: Error]
}>()

const size = computed(() => formatBytes(props.source.size, props.locale))
let ready = false

function announceReady() {
  if (ready) return
  ready = true
  emit('ready', {
    pageCount: 0,
    capabilities: defaultCapabilities(props.kind),
  })
}

function handleError() {
  emit('error', new Error(props.messages.renderers.audio.loadError))
}

onMounted(announceReady)
</script>

<template>
  <div class="w-file-viewer__audio">
    <div class="w-file-viewer__audio-card">
      <div class="w-file-viewer__audio-cover" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <path
            d="M18 33V13l18-4v20"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle cx="13.5" cy="34.5" r="5" stroke="currentColor" stroke-width="2.2" />
          <circle cx="31.5" cy="30.5" r="5" stroke="currentColor" stroke-width="2.2" />
        </svg>
      </div>
      <div class="w-file-viewer__audio-info">
        <strong>{{ source.name }}</strong>
        <span
          >{{ messages.viewer.format }}: {{ source.extension.toUpperCase()
          }}<template v-if="size"> · {{ size }}</template></span
        >
      </div>
    </div>
    <audio :src="source.url" controls preload="metadata" @error="handleError">
      {{ messages.renderers.audio.loadError }}
    </audio>
  </div>
</template>
