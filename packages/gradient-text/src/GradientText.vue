<script setup lang="ts">
import { computed } from 'vue'
import type { GradientTextProps, GradientTextSlotProps } from './types'

defineOptions({
  name: 'WGradientText',
})

const props = withDefaults(defineProps<GradientTextProps>(), {
  colors: () => ['#4f46e5', '#9333ea', '#0ea5e9'],
  gradient: '',
  type: 'linear',
  angle: 90,
  animate: false,
  duration: 6000,
  animationDirection: 'alternate',
  tag: 'span',
})

defineSlots<{
  default?: (props: GradientTextSlotProps) => unknown
}>()

const backgroundImage = computed(() => {
  if (props.gradient) return props.gradient

  const colors = props.colors.length > 0 ? props.colors : ['#4f46e5', '#9333ea', '#0ea5e9']
  const stops = colors.join(', ')

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
  <component :is="tag" class="w-gradient-text" :class="{ 'is-animated': animate }" :style="style">
    <slot v-bind="slotProps" />
  </component>
</template>
