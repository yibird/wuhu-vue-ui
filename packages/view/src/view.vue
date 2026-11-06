<template>
  <div
    class="w-view"
    :class="[{ 'w-view-full': props.full }, props.classes?.root]"
    :style="[style, props.styles?.root]"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { computed, provide, type CSSProperties } from 'vue'
import { toCssSize, viewContextKey } from './context'
import type { ViewProps, ViewSlots } from './types'

const props = withDefaults(defineProps<ViewProps>(), {
  full: true,
  direction: 'vertical',
})

defineSlots<ViewSlots>()

const gap = computed(() => (props.gap === undefined ? '0px' : toCssSize(props.gap)))
const direction = computed(() => props.direction)

// `View` is always a flex container so `direction` works on its own; `gap`
// only controls spacing instead of also toggling the layout mode.
const style = computed<CSSProperties>(() => ({
  display: 'flex',
  flexDirection: props.direction === 'horizontal' ? 'row' : 'column',
  gap: gap.value,
}))

provide(viewContextKey, { direction, gap })
</script>
