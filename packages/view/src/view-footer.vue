<template>
  <footer class="w-view-footer">
    <slot />
  </footer>
</template>

<script setup lang="ts">
import type { VNode } from 'vue'

defineSlots<{
  default?: () => VNode | VNode[]
}>()
defineOptions({ name: 'ViewFooter' })
</script>
