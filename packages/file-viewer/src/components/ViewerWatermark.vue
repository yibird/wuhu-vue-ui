<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import type { ViewerWatermarkProps } from './types'

const props = defineProps<ViewerWatermarkProps>()

defineSlots<{
  watermark?: (props: { text: string }) => unknown
}>()

const watermarkStyle = computed(() => {
  const options = props.options
  const style: Record<string, string> = {
    '--w-file-viewer-watermark-opacity': String(options.opacity ?? 0.12),
    '--w-file-viewer-watermark-size': `${options.fontSize ?? 22}px`,
    '--w-file-viewer-watermark-rotate': `${options.rotate ?? -24}deg`,
  }
  if (options.color) style['--w-file-viewer-watermark-color'] = options.color
  return style as CSSProperties
})
</script>

<template>
  <div class="w-file-viewer__watermark" :style="watermarkStyle" aria-hidden="true">
    <slot name="watermark" :text="text">
      <span v-for="index in 9" :key="index">{{ text }}</span>
    </slot>
  </div>
</template>
