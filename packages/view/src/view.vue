<template>
  <div class="w-view" :class="{ 'w-view-full': props.full }" :style="style">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { computed, provide, type CSSProperties } from 'vue'
import { toCssSize, viewContextKey } from './context'
import type { ViewProps, ViewSlots } from './types'

defineOptions({
  name: 'View',
})
const props = withDefaults(defineProps<ViewProps>(), {
  full: true,
  direction: 'vertical',
})

defineSlots<ViewSlots>()

const gap = computed(() => (props.gap === undefined ? '0px' : toCssSize(props.gap)))
const direction = computed(() => props.direction)

const style = computed(() => {
  const viewStyle: CSSProperties = {}
  if (props.gap !== undefined) {
    viewStyle.display = 'flex'
    viewStyle.flexDirection = props.direction === 'horizontal' ? 'row' : 'column'
    viewStyle.gap = gap.value
  }
  return viewStyle
})

provide(viewContextKey, { direction, gap })
</script>
