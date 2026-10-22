<script setup lang="ts">
import { computed } from 'vue'
import { resolveIcon } from './icons'
import type { IconProps } from './types'

defineOptions({
  name: 'WIcon',
})

const props = withDefaults(defineProps<IconProps>(), {
  size: 16,
  color: undefined,
  strokeWidth: 2,
  label: undefined,
  spin: false,
})

const paths = computed(() => resolveIcon(props.name))
const dimension = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
const accessible = computed(() => Boolean(props.label))
</script>

<template>
  <svg
    class="w-icon"
    :class="{ 'w-icon--spin': spin }"
    :width="dimension"
    :height="dimension"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :style="{ color }"
    :role="accessible ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="accessible ? undefined : 'true'"
    focusable="false"
  >
    <path v-for="(path, index) in paths" :key="index" :d="path" />
  </svg>
</template>
