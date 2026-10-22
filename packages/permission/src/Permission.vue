<script setup lang="ts">
import { computed, inject } from 'vue'
import { PERMISSION_KEY, checkPermission } from './permissions'
import type { PermissionProps } from './types'

defineOptions({
  name: 'WPermission',
})

const props = withDefaults(defineProps<PermissionProps>(), {
  mode: 'all',
})

defineSlots<{
  default?: () => unknown
  fallback?: () => unknown
}>()

const context = inject(PERMISSION_KEY, null)

const allowed = computed(() => {
  if (props.permissions !== undefined) {
    return checkPermission(props.value, new Set(props.permissions), props.mode)
  }

  // No provider and no explicit list: deny by default (fail-closed).
  return context ? context.has(props.value, props.mode) : false
})
</script>

<template>
  <slot v-if="allowed" />
  <slot v-else name="fallback" />
</template>
