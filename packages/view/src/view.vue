<template>
  <div class="w-view" :class="{ 'w-view-full': props.full }" :style="style">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { computed, provide, type CSSProperties } from 'vue'
import { toCssSize, viewContextKey } from './context'
import type { WViewProps } from './types'

defineOptions({
  name: 'WView',
})
const props = withDefaults(defineProps<WViewProps>(), {
  padding: true,
  full: true,
  direction: 'vertical',
})

const gap = computed(() => (props.gap === undefined ? '0px' : toCssSize(props.gap)))
const direction = computed(() => props.direction)

const style = computed(() => {
  const viewStyle: CSSProperties = {}
  if (typeof props.padding === 'boolean' && props.padding) {
    viewStyle.padding = '10px'
  } else if (typeof props.padding === 'number') {
    viewStyle.padding = toCssSize(props.padding)
  } else if (typeof props.padding === 'string') {
    viewStyle.padding = props.padding
  }
  if (props.gap !== undefined) {
    viewStyle.display = 'flex'
    viewStyle.flexDirection = props.direction === 'horizontal' ? 'row' : 'column'
    viewStyle.gap = gap.value
  }
  return viewStyle
})

provide(viewContextKey, { direction, gap })
</script>

<style lang="less" scoped>
.w-view {
  box-sizing: border-box;
  width: 100%;
  background-color: var(--w-color-bg, #f8fafc);

  &-full {
    position: absolute;
    inset: 0;
    height: 100%;
    min-height: 100%;
    overflow: hidden;
  }
}
</style>
