<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import type { MotionGroupProps } from './types'

defineOptions({
  name: 'WMotionGroup',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<MotionGroupProps>(), {
  animation: 'fade',
  direction: 'vertical',
  tag: 'div',
  appear: false,
  duration: 260,
  moveDuration: undefined,
  absoluteLeave: true,
  disabled: false,
})

const attrs = useAttrs()

const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const transitionName = computed(() => `w-motion-${props.animation}`)

const rootClasses = computed(() => [
  'w-motion-group',
  `w-motion-group--${props.animation}`,
  `w-motion-group--${props.direction}`,
  {
    'w-motion-group--absolute-leave': props.absoluteLeave,
    'w-motion-group--disabled': props.disabled,
  },
])

const rootStyle = computed(() => {
  const duration = Math.max(0, props.duration)
  const moveDuration = Math.max(0, props.moveDuration ?? duration)

  return {
    '--w-motion-duration': `${duration}ms`,
    // Vue's TransitionGroup ignores the `css` flag for FLIP moves: it decides
    // whether to run a move by measuring the computed transition. A zero
    // duration disables the move without changing the documented duration
    // props, so toggling `disabled` back restores the animation.
    '--w-motion-move-duration': `${props.disabled ? 0 : moveDuration}ms`,
  }
})

interface SavedInlineStyle {
  position: string
  left: string
  top: string
  width: string
  height: string
  boxSizing: string
}

const savedLeaveStyles = new WeakMap<HTMLElement, SavedInlineStyle>()

/**
 * Finds the element that establishes the containing block for an absolutely
 * positioned child: a non-static position, or a transform/filter/perspective
 * or paint containment.
 */
function getContainingBlock(element: HTMLElement): HTMLElement {
  const doc = element.ownerDocument
  let parent = element.parentElement

  while (parent && parent !== doc.documentElement) {
    const style = getComputedStyle(parent)
    if (
      style.position !== 'static' ||
      style.transform !== 'none' ||
      style.filter !== 'none' ||
      style.perspective !== 'none' ||
      (style.contain !== '' && style.contain !== 'none')
    ) {
      return parent
    }
    parent = parent.parentElement
  }

  return doc.documentElement
}

function toPixels(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Pins a leaving item to its current position and size before it is taken out
 * of the document flow. Without this, `position: absolute` loses the original
 * `top` (vertical lists) or width (grids), so every leaving item stacks at the
 * origin / stretches across the whole list.
 */
function handleBeforeLeave(element: Element): void {
  if (!props.absoluteLeave || props.disabled || !(element instanceof HTMLElement)) {
    return
  }

  if (savedLeaveStyles.has(element)) return

  const container = getContainingBlock(element)
  const rect = element.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  const containerStyle = getComputedStyle(container)
  const elementStyle = getComputedStyle(element)

  // `getBoundingClientRect()` is affected by scrolling while absolute offsets
  // are relative to the un-scrolled padding box, so add the scroll delta back.
  const scrollLeft = container.scrollLeft || 0
  const scrollTop = container.scrollTop || 0
  const borderLeft = toPixels(containerStyle.borderLeftWidth)
  const borderTop = toPixels(containerStyle.borderTopWidth)
  // Absolute `left` / `top` address the margin edge.
  const marginLeft = toPixels(elementStyle.marginLeft)
  const marginTop = toPixels(elementStyle.marginTop)

  savedLeaveStyles.set(element, {
    position: element.style.position,
    left: element.style.left,
    top: element.style.top,
    width: element.style.width,
    height: element.style.height,
    boxSizing: element.style.boxSizing,
  })

  element.style.position = 'absolute'
  element.style.left = `${rect.left - containerRect.left - borderLeft + scrollLeft - marginLeft}px`
  element.style.top = `${rect.top - containerRect.top - borderTop + scrollTop - marginTop}px`
  element.style.width = `${rect.width}px`
  element.style.height = `${rect.height}px`
  // Explicit sizes below are border-box sizes, matching the measured rect.
  element.style.boxSizing = 'border-box'
}

/**
 * Restores any inline positioning if a leave transition is cancelled because
 * the item is re-inserted before it finished leaving.
 */
function handleBeforeEnter(element: Element): void {
  if (!(element instanceof HTMLElement)) return

  const saved = savedLeaveStyles.get(element)
  if (!saved) return

  savedLeaveStyles.delete(element)
  element.style.position = saved.position
  element.style.left = saved.left
  element.style.top = saved.top
  element.style.width = saved.width
  element.style.height = saved.height
  element.style.boxSizing = saved.boxSizing
}
</script>

<template>
  <TransitionGroup
    v-bind="forwardedAttrs"
    :tag="tag"
    :name="transitionName"
    :appear="appear"
    :css="!disabled"
    @before-enter="handleBeforeEnter"
    @before-leave="handleBeforeLeave"
    :class="[rootClasses, attrs.class]"
    :style="[rootStyle, attrs.style]"
  >
    <slot />
  </TransitionGroup>
</template>
