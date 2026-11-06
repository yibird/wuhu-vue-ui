<script setup lang="ts">
import { onMounted } from 'vue'
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
  emit('error', new Error(props.messages.renderers.video.loadError))
}

onMounted(announceReady)
</script>

<template>
  <div class="w-file-viewer__video">
    <video
      :src="source.url"
      :poster="options.video?.poster"
      controls
      playsinline
      preload="metadata"
      @loadedmetadata="announceReady"
      @error="handleError"
    >
      {{ messages.renderers.video.loadError }}
    </video>
  </div>
</template>
