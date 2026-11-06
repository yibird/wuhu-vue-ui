<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import type { RippleOptions, RippleProps } from './types'
import { createRipple } from './useRipple'

const props = withDefaults(defineProps<RippleProps>(), {
  color: 'currentColor',
  duration: 600,
  disabled: false,
  center: false,
  trigger: 'pointerdown',
  tag: 'span',
})

const root = ref<HTMLElement | null>(null)

function rippleOptions(): RippleOptions {
  return {
    color: props.color,
    duration: props.duration,
    disabled: props.disabled,
    center: props.center,
    trigger: props.trigger,
  }
}

function handlePointerDown(event: PointerEvent) {
  if (props.trigger !== 'pointerdown' || !root.value) return
  createRipple(root.value, event, rippleOptions())
}

function handleClick(event: MouseEvent) {
  if (!root.value) return

  const keyboard = event.detail === 0
  if (props.trigger === 'click' || keyboard) {
    createRipple(root.value, event, rippleOptions())
  }
}

onBeforeUnmount(() => {
  root.value?.querySelectorAll('.w-ripple__wave').forEach((node) => node.remove())
})
</script>

<template>
  <component
    :is="tag"
    ref="root"
    class="w-ripple"
    @pointerdown="handlePointerDown"
    @click="handleClick"
  >
    <slot />
  </component>
</template>
