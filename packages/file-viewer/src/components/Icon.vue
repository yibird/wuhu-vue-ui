<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name: string
    size?: number | string
  }>(),
  {
    size: 18,
  },
)

const ICONS: Record<string, string[]> = {
  'chevron-left': ['m12.5 5-5 5 5 5'],
  'chevron-right': ['m7.5 5 5 5-5 5'],
  'chevron-double-left': ['m11.5 5-5 5 5 5', 'm16.5 5-5 5 5 5'],
  'chevron-double-right': ['m8.5 5 5 5-5 5', 'm13.5 5 5 5-5 5'],
  'zoom-in': ['M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z', 'm13 13 4 4', 'M9 6.5v5M6.5 9h5'],
  'zoom-out': ['M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z', 'm13 13 4 4', 'M6.5 9h5'],
  'rotate-left': ['M4 5v5h5', 'M4.8 10A6.5 6.5 0 1 0 6 5.2'],
  'rotate-right': ['M16 5v5h-5', 'M15.2 10A6.5 6.5 0 1 1 14 5.2'],
  download: ['M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 16h12'],
  printer: ['M6 8V3.5h8V8', 'M4 8h12v6h-3v3H7v-3H4V8Z', 'M13.5 11h1'],
  expand: ['M4 8V4h4M16 8V4h-4M4 12v4h4M16 12v4h-4'],
  minimize: ['M8 4v4H4M12 4v4h4M8 16v-4H4M12 16v-4h4'],
  sun: [
    'M10 6.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z',
    'M10 2v1.6M10 16.4V18M2 10h1.6M16.4 10H18M4.3 4.3l1.1 1.1M14.6 14.6l1.1 1.1M4.3 15.7l1.1-1.1M14.6 5.4l1.1-1.1',
  ],
  moon: ['M16.5 12.5A7 7 0 0 1 7.5 3.5a7 7 0 1 0 9 9Z'],
  info: ['M10 3.2a6.8 6.8 0 1 0 0 13.6 6.8 6.8 0 0 0 0-13.6Z', 'M10 9v5', 'M10 6.2v.1'],
  close: ['m5 5 10 10M15 5 5 15'],
  external: ['M11 4h5v5M16 4l-7 7M14 12v4H4V6h4'],
  check: ['m4 10 4 4 8-8'],
  alert: ['M10 3 18 17H2L10 3Z', 'M10 8v4', 'M10 14.5v.1'],
  file: ['M6 2.5h5l4 4V17.5H6V2.5Z', 'M11 2.5v4h4'],
  retry: ['M4 5v5h5', 'M4.8 10A6.5 6.5 0 1 0 6 5.2'],
  copy: ['M7.5 7.5h8.5v9H7.5v-9Z', 'M12.5 7.5v-2A2 2 0 0 0 10.5 3.5H4a1.5 1.5 0 0 0 0 3h.5'],
  'file-viewer': ['M5.5 2.5h6l3.5 3.5v11.5h-9.5V2.5Z', 'M11.5 2.5V6H15', 'M8 10h4M8 13h3'],
}

const paths = computed(() => ICONS[props.name] ?? ICONS['file-viewer'] ?? [])
const size = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="(path, index) in paths" :key="index" :d="path" />
  </svg>
</template>
