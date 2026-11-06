<script setup lang="ts">
import { computed } from 'vue'
import { formatBytes } from '../core/format'
import type { FileViewerStatusBarSlotProps } from '../types'
import type { ViewerStatusBarProps } from './types'

const props = defineProps<ViewerStatusBarProps>()

defineSlots<{
  'status-bar'?: (props: FileViewerStatusBarSlotProps) => unknown
}>()

const zoomPercent = computed(() => `${Math.round(props.zoom * 100)}%`)
</script>

<template>
  <footer class="w-file-viewer__status">
    <slot name="status-bar" v-bind="slotProps">
      <span v-if="meta" class="w-file-viewer__status-format">{{ meta.label }}</span>
      <span v-if="meta?.size !== undefined" class="w-file-viewer__status-item">{{
        formatBytes(meta.size, locale)
      }}</span>
      <span v-if="capabilities.paged && pageCount > 0" class="w-file-viewer__status-item">
        {{ messages.page }} {{ page }} / {{ pageCount }}
      </span>
      <span v-if="capabilities.zoom" class="w-file-viewer__status-item">{{ zoomPercent }}</span>
      <span class="w-file-viewer__status-spacer" />
    </slot>
  </footer>
</template>
