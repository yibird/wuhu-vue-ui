<script setup lang="ts">
import { useControllableState, usePointerDrag } from '@wuhu-vue-ui/core'
import { computed, onBeforeUnmount, reactive, readonly, ref, watch } from 'vue'
import type { ImgComparisonSliderProps, ImgComparisonSliderSlotProps } from './types'

const props = withDefaults(defineProps<ImgComparisonSliderProps>(), {
  ariaLabel: '图片对比滑块',
  before: '',
  after: '',
  direction: 'horizontal',
  disabled: false,
  aspectRatio: '16 / 9',
  keyboardStep: 1,
})

const emit = defineEmits<{
  'update:value': [value: number]
  change: [value: number]
  dragstart: [value: number]
  dragend: [value: number]
  error: [side: 'before' | 'after', event: Event]
}>()

defineSlots<{
  before?: () => unknown
  after?: () => unknown
  handle?: (props: ImgComparisonSliderSlotProps) => unknown
}>()

/**
 * Pointer gestures that start on interactive slot content should not move the
 * divider or steal focus. `data-w-comparison-ignore` remains available for any
 * other custom element that needs to opt out.
 */
const IGNORE_POINTER_SELECTOR = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[contenteditable]',
  '[data-w-comparison-ignore]',
].join(',')

const rootRef = ref<HTMLElement>()
const handleRef = ref<HTMLElement>()
const dragging = ref(false)
const imageErrors = reactive<Record<'before' | 'after', boolean>>({
  before: false,
  after: false,
})

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 50
  return Math.min(100, Math.max(0, value))
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

const { value: position, setValue: setPositionValue } = useControllableState({
  value: () => props.value,
  defaultValue: 50,
  normalize: (value) => round(clamp(value)),
  onChange: (next) => {
    emit('update:value', next)
    emit('change', next)
  },
})

let dragRect: DOMRect | null = null
let dragStartPosition = position.value

/**
 * The pointerdown rect is only valid while the page is still. Any scroll or
 * resize during the gesture invalidates it, so the next move measures again
 * instead of comparing viewport coordinates against a stale box.
 */
function invalidateDragRect() {
  dragRect = null
}

function trackGeometry() {
  window.addEventListener('scroll', invalidateDragRect, true)
  window.addEventListener('resize', invalidateDragRect)
}

function untrackGeometry() {
  window.removeEventListener('scroll', invalidateDragRect, true)
  window.removeEventListener('resize', invalidateDragRect)
}

const displayPosition = computed(() => round(position.value))
const isHorizontal = computed(() => props.direction === 'horizontal')

const slotProps = computed<ImgComparisonSliderSlotProps>(() => ({
  position: displayPosition.value,
  direction: props.direction,
}))

const rootStyle = computed(() => ({
  aspectRatio: String(props.aspectRatio),
  // Layers are absolutely positioned, so without an intrinsic aspect ratio the
  // root collapses to 0px. In `auto` mode the consumer owns the height, so
  // fill the container instead.
  ...(props.aspectRatio === 'auto' ? { height: '100%' } : {}),
}))

const beforeClip = computed(() => {
  if (isHorizontal.value) {
    return `inset(0 ${round(100 - position.value)}% 0 0)`
  }
  return `inset(0 0 ${round(100 - position.value)}% 0)`
})

const afterClip = computed(() => {
  if (isHorizontal.value) {
    return `inset(0 0 0 ${round(position.value)}%)`
  }
  return `inset(${round(position.value)}% 0 0 0)`
})

const handleStyle = computed(() =>
  isHorizontal.value ? { left: `${displayPosition.value}%` } : { top: `${displayPosition.value}%` },
)

const ariaOrientation = computed(() => (isHorizontal.value ? 'horizontal' : 'vertical'))

watch(
  () => props.before,
  () => {
    imageErrors.before = false
  },
)

watch(
  () => props.after,
  () => {
    imageErrors.after = false
  },
)

// Disabling mid-drag must release the global pointer listeners immediately and
// report the gesture exactly once, like a pointer release.
watch(
  () => props.disabled,
  (disabled) => {
    if (!disabled || !dragging.value) return
    stopDragging()
    emit('dragend', position.value)
  },
)

function handleImageError(side: 'before' | 'after', event: Event) {
  imageErrors[side] = true
  emit('error', side, event)
}

function setPosition(value: number) {
  setPositionValue(value)
}

function updateFromPointer(event: PointerEvent, rect = dragRect) {
  const root = rootRef.value
  if (!root) return

  const bounds = rect ?? root.getBoundingClientRect()
  if (!bounds || bounds.width === 0 || bounds.height === 0) return

  const ratio = isHorizontal.value
    ? (event.clientX - bounds.left) / bounds.width
    : (event.clientY - bounds.top) / bounds.height

  setPosition(ratio * 100)
}

function handlePointerDown(event: PointerEvent) {
  if (props.disabled || event.button !== 0) return

  const target = event.target as Element | null
  if (target?.closest(IGNORE_POINTER_SELECTOR)) return

  const root = rootRef.value
  const rect = root?.getBoundingClientRect()
  if (!root || !rect || rect.width === 0 || rect.height === 0) return

  event.preventDefault()
  focusHandle()
  dragging.value = true
  dragRect = rect
  dragStartPosition = position.value
  trackGeometry()

  // Report the position before the pointer moves the divider.
  emit('dragstart', dragStartPosition)
  updateFromPointer(event, rect)

  drag.start(event)
}

function handlePointerMove(event: PointerEvent) {
  if (!dragging.value) return
  updateFromPointer(event)
}

function handlePointerUp(event: PointerEvent) {
  if (!dragging.value) return

  updateFromPointer(event)
  stopDragging()
  emit('dragend', position.value)
}

function handlePointerCancel() {
  if (!dragging.value) return

  const restore = dragStartPosition
  stopDragging()
  setPosition(restore)
  emit('dragend', position.value)
}

const drag = usePointerDrag({
  onMove: handlePointerMove,
  onEnd: handlePointerUp,
  onCancel: handlePointerCancel,
})

function stopDragging() {
  dragging.value = false
  dragRect = null
  untrackGeometry()
  drag.stop()
}

function handleKeydown(event: KeyboardEvent) {
  if (props.disabled) return

  const step = Math.max(0.01, props.keyboardStep)
  const largeStep = step * 10
  let next: number | undefined

  // Vertical sliders move the divider towards the top with the "up" keys, so
  // the numeric percentage decreases (the value is measured from the top).
  const keySteps: Record<string, number> = isHorizontal.value
    ? { ArrowLeft: -step, ArrowRight: step }
    : { ArrowUp: -step, ArrowDown: step }

  keySteps.PageUp = isHorizontal.value ? largeStep : -largeStep
  keySteps.PageDown = -keySteps.PageUp

  if (event.key in keySteps) {
    next = position.value + keySteps[event.key]!
  } else if (event.key === 'Home') {
    next = 0
  } else if (event.key === 'End') {
    next = 100
  }

  if (next === undefined) return

  event.preventDefault()
  setPosition(next)
}

function focusHandle() {
  handleRef.value?.focus({ preventScroll: true })
}

onBeforeUnmount(stopDragging)

defineExpose({
  position: readonly(position),
  setPosition,
  focus: focusHandle,
})
</script>

<template>
  <div
    ref="rootRef"
    class="w-img-comparison-slider"
    :class="[
      `w-img-comparison-slider--${direction}`,
      { 'is-dragging': dragging, 'is-disabled': disabled },
      classes?.root,
    ]"
    :style="[rootStyle, styles?.root]"
    @pointerdown="handlePointerDown"
  >
    <div
      class="w-img-comparison-slider__layer w-img-comparison-slider__layer--before"
      :class="[{ 'has-image-error': imageErrors.before }, classes?.before]"
      :style="[styles?.before, { clipPath: beforeClip }]"
    >
      <slot name="before">
        <img
          v-if="before && !imageErrors.before"
          :src="before"
          alt=""
          :class="classes?.image"
          :style="styles?.image"
          draggable="false"
          loading="lazy"
          @error="handleImageError('before', $event)"
        />
      </slot>
    </div>

    <div
      class="w-img-comparison-slider__layer w-img-comparison-slider__layer--after"
      :class="[{ 'has-image-error': imageErrors.after }, classes?.after]"
      :style="[styles?.after, { clipPath: afterClip }]"
    >
      <slot name="after">
        <img
          v-if="after && !imageErrors.after"
          :src="after"
          alt=""
          :class="classes?.image"
          :style="styles?.image"
          draggable="false"
          loading="lazy"
          @error="handleImageError('after', $event)"
        />
      </slot>
    </div>

    <div
      ref="handleRef"
      class="w-img-comparison-slider__handle"
      :class="classes?.handle"
      :style="[styles?.handle, handleStyle]"
      role="slider"
      :aria-label="ariaLabel"
      :tabindex="disabled ? -1 : 0"
      :aria-valuemin="0"
      :aria-valuemax="100"
      :aria-valuenow="displayPosition"
      :aria-valuetext="`${displayPosition}%`"
      :aria-orientation="ariaOrientation"
      :aria-disabled="disabled"
      @keydown="handleKeydown"
    >
      <span
        class="w-img-comparison-slider__line"
        :class="classes?.line"
        :style="styles?.line"
        aria-hidden="true"
      />
      <span class="w-img-comparison-slider__knob" :class="classes?.knob" :style="styles?.knob">
        <slot name="handle" v-bind="slotProps">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="m9.5 8-4 4 4 4M14.5 8l4 4-4 4"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </slot>
      </span>
    </div>
  </div>
</template>
