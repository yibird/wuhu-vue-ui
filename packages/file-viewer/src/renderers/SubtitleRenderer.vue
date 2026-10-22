<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { escapeHtml } from '../core/format'
import { printHtml } from '../core/print'
import { parseSubtitles, type SubtitleCue } from '../core/subtitle'
import { defaultCapabilities } from '../core/capabilities'
import type { FileViewerRendererProps } from '../types'
import { useTextSource } from './useTextSource'

defineOptions({
  name: 'WFileViewerSubtitleRenderer',
})

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

const cues = ref<SubtitleCue[]>([])
const maxBytes = computed(() => props.options.text?.maxBytes ?? 4 * 1024 * 1024)
const { loaded, load: loadText } = useTextSource(props, {
  maxBytes: () => maxBytes.value,
  errorMessage: () => props.messages.renderers.subtitle.parseError,
  onReady: () =>
    emit('ready', {
      pageCount: 0,
      capabilities: defaultCapabilities(props.kind),
    }),
  onError: (error) => emit('error', error),
})

async function load(): Promise<void> {
  cues.value = parseSubtitles(await loadText(), props.source.extension)
}

function print(): boolean {
  const rows = cues.value
    .map(
      (cue) =>
        `<div style="margin:0 0 10px;"><span style="color:#64748b;font-family:monospace;font-size:11px;">${escapeHtml(
          cue.start,
        )} → ${escapeHtml(cue.end)}</span><div>${escapeHtml(cue.text).replace(/\n/g, '<br />')}</div></div>`,
    )
    .join('')
  return printHtml(props.source.name, rows)
}

defineExpose({ print })

onMounted(load)
</script>

<template>
  <div class="w-file-viewer__subtitle">
    <div class="w-file-viewer__renderer-toolbar">
      <span class="w-file-viewer__renderer-label">{{ source.name }}</span>
      <span class="w-file-viewer__badge">{{ source.extension.toUpperCase() }}</span>
    </div>
    <div v-if="loaded && cues.length === 0" class="w-file-viewer__placeholder is-compact">
      <p>{{ messages.renderers.subtitle.empty }}</p>
    </div>
    <ol v-else class="w-file-viewer__subtitle-list">
      <li v-for="cue in cues" :key="cue.index" class="w-file-viewer__subtitle-cue">
        <span class="w-file-viewer__subtitle-time">{{ cue.start }} → {{ cue.end }}</span>
        <p>{{ cue.text }}</p>
      </li>
    </ol>
  </div>
</template>
