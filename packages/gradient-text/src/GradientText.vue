<script setup lang="ts">
import { computed } from 'vue'
import { DEFAULT_GRADIENT_COLORS } from './constants'
import type { GradientTextProps, GradientTextSlotProps } from './types'

const props = withDefaults(defineProps<GradientTextProps>(), {
  colors: () => [...DEFAULT_GRADIENT_COLORS],
  gradient: '',
  type: 'linear',
  angle: 90,
  animate: false,
  duration: 6000,
  animationDirection: 'alternate',
})

defineSlots<{
  default?: (props: GradientTextSlotProps) => unknown
}>()

const backgroundImage = computed(() => {
  if (props.gradient) return props.gradient

  const colors = props.colors.length > 0 ? props.colors : DEFAULT_GRADIENT_COLORS
  // A single stop is invalid CSS and would leave transparent text. Repeating
  // the color produces a solid fill for every gradient type.
  const single = colors[0]
  const stops =
    colors.length === 1 && single !== undefined ? `${single}, ${single}` : colors.join(', ')

  if (props.type === 'radial') {
    return `radial-gradient(circle at 50% 50%, ${stops})`
  }
  if (props.type === 'conic') {
    return `conic-gradient(from ${props.angle}deg at 50% 50%, ${stops})`
  }
  return `linear-gradient(${props.angle}deg, ${stops})`
})

const style = computed(() => {
  const result: Record<string, string> = {
    backgroundImage: backgroundImage.value,
    backgroundSize: props.animate ? (props.type === 'linear' ? '200% auto' : '200% 200%') : 'auto',
  }

  if (props.animate) {
    result.animationDuration = `${Math.max(0, props.duration)}ms`
    result.animationDirection = props.animationDirection
  }

  return result
})

const slotProps = computed<GradientTextSlotProps>(() => ({
  gradient: backgroundImage.value,
}))
</script>

<template>
  <span class="w-gradient-text" :class="{ 'is-animated': animate }" :style="style">
    <slot v-bind="slotProps" />
  </span>
</template>
