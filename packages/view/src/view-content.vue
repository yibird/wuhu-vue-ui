<template>
  <main class="w-view-content">
    <slot />
  </main>
</template>

<script setup lang="ts">
import type { VNode } from 'vue'

defineSlots<{
  default?: () => VNode | VNode[]
}>()
</script>
