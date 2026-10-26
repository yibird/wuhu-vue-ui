<script setup lang="ts">
import { computed } from 'vue'
import { TOOLBAR_ICON_PATHS, type ToolbarIconName } from './icons'

const props = defineProps<{ name: ToolbarIconName }>()

const paths = computed(() => TOOLBAR_ICON_PATHS[props.name])
</script>

<template>
  <svg
    class="w-tiptap-editor__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="path in paths" :key="path" :d="path" />
  </svg>
</template>
