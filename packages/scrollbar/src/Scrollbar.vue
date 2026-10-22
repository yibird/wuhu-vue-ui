<script setup lang="ts">
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type CSSProperties,
} from 'vue'
import type { ScrollbarDirection, ScrollbarProps, ScrollbarScrollEvent } from './types'

defineOptions({
  name: 'WScrollbar',
})

const props = withDefaults(defineProps<ScrollbarProps>(), {
  height: '',
  maxHeight: '',
  native: false,
  noresize: false,
  tag: 'div',
  always: false,
  minSize: 20,
  distance: 0,
})

const emit = defineEmits<{
  scroll: [event: ScrollbarScrollEvent]
  end: [direction: ScrollbarDirection]
}>()

/** Distance between the bar edge and the thumb, in pixels. */
const GAP = 4

interface BarInfo {
  offset: 'offsetWidth' | 'offsetHeight'
  scroll: 'scrollLeft' | 'scrollTop'
  scrollSize: 'scrollWidth' | 'scrollHeight'
  client: 'clientX' | 'clientY'
  direction: 'left' | 'top'
}

const BAR_MAP: Record<'horizontal' | 'vertical', BarInfo> = {
  horizontal: {
    offset: 'offsetWidth',
    scroll: 'scrollLeft',
    scrollSize: 'scrollWidth',
    client: 'clientX',
    direction: 'left',
  },
  vertical: {
    offset: 'offsetHeight',
    scroll: 'scrollTop',
    scrollSize: 'scrollHeight',
    client: 'clientY',
    direction: 'top',
  },
}

const wrapRef = ref<HTMLDivElement>()
const viewRef = ref<HTMLElement>()
const horizontalBarRef = ref<HTMLDivElement>()
const horizontalThumbRef = ref<HTMLDivElement>()
const verticalBarRef = ref<HTMLDivElement>()
const verticalThumbRef = ref<HTMLDivElement>()

const moveX = ref(0)
const moveY = ref(0)
const sizeWidth = ref('')
const sizeHeight = ref('')
const ratioX = ref(1)
const ratioY = ref(1)
const visibleX = ref(false)
const visibleY = ref(false)
const dragging = ref<'X' | 'Y' | null>(null)

let cursorDown = false
let cursorLeave = false
let cursorInside = false
let draggingAxis: 'X' | 'Y' | null = null
let baseScrollWidth = 0
let baseScrollHeight = 0
const thumbState: Partial<Record<'X' | 'Y', number>> = {}

let resizeObserver: ResizeObserver | undefined
let wrapScrollTop = 0
let wrapScrollLeft = 0
let direction: ScrollbarDirection | undefined
const distanceScrollState: Record<ScrollbarDirection, boolean> = {
  bottom: false,
  top: false,
  right: false,
  left: false,
}

const addUnit = (value: string | number | undefined) => {
  if (value === undefined || value === null || value === '') return ''
  return typeof value === 'number' ? `${value}px` : value
}

const mergedWrapStyle = computed(() => {
  const style: CSSProperties = {}
  const height = addUnit(props.height)
  const maxHeight = addUnit(props.maxHeight)
  if (height) style.height = height
  if (maxHeight) style.maxHeight = maxHeight
  return [props.styles?.wrap, style]
})

const mergedWrapClass = computed(() => [
  props.classes?.wrap,
  'w-scrollbar__wrap',
  { 'w-scrollbar__wrap--hidden-default': !props.native },
])

const verticalThumbStyle = computed<CSSProperties>(() => ({
  height: sizeHeight.value,
  transform: `translateY(${moveY.value}%)`,
}))

const horizontalThumbStyle = computed<CSSProperties>(() => ({
  width: sizeWidth.value,
  transform: `translateX(${moveX.value}%)`,
}))

function barElement(axis: 'X' | 'Y') {
  return axis === 'X' ? horizontalBarRef.value : verticalBarRef.value
}

function thumbElement(axis: 'X' | 'Y') {
  return axis === 'X' ? horizontalThumbRef.value : verticalThumbRef.value
}

function barInfo(axis: 'X' | 'Y') {
  return axis === 'X' ? BAR_MAP.horizontal : BAR_MAP.vertical
}

function ratio(axis: 'X' | 'Y') {
  return axis === 'X' ? ratioX.value : ratioY.value
}

function handleBarScroll(wrap: HTMLDivElement) {
  const offsetHeight = wrap.offsetHeight - GAP
  const offsetWidth = wrap.offsetWidth - GAP

  moveY.value = offsetHeight ? ((wrap.scrollTop * 100) / offsetHeight) * ratioY.value : 0
  moveX.value = offsetWidth ? ((wrap.scrollLeft * 100) / offsetWidth) * ratioX.value : 0
}

function updateBar() {
  const wrap = wrapRef.value
  if (!wrap || props.native) return

  const offsetHeight = wrap.offsetHeight - GAP
  const offsetWidth = wrap.offsetWidth - GAP

  const originalHeight = offsetHeight ** 2 / wrap.scrollHeight
  const originalWidth = offsetWidth ** 2 / wrap.scrollWidth
  const height = Math.max(originalHeight, props.minSize)
  const width = Math.max(originalWidth, props.minSize)

  ratioY.value =
    originalHeight / (offsetHeight - originalHeight) / (height / (offsetHeight - height))
  ratioX.value = originalWidth / (offsetWidth - originalWidth) / (width / (offsetWidth - width))

  sizeHeight.value = height + GAP < offsetHeight ? `${height}px` : ''
  sizeWidth.value = width + GAP < offsetWidth ? `${width}px` : ''

  if (cursorInside) syncBarVisibility()
}

function syncBarVisibility() {
  visibleX.value = cursorInside && !!sizeWidth.value
  visibleY.value = cursorInside && !!sizeHeight.value
}

function update() {
  updateBar()
  if (wrapRef.value) handleBarScroll(wrapRef.value)
  if (direction) distanceScrollState[direction] = false
}

function updateTriggerStatus(arrivedStates: Record<ScrollbarDirection, boolean>) {
  if (!direction) return

  const oppositeDirection: Record<ScrollbarDirection, ScrollbarDirection> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  }
  const opposite = oppositeDirection[direction]
  const arrived = arrivedStates[direction]

  if (arrived && !distanceScrollState[direction]) {
    distanceScrollState[direction] = true
  }

  if (!arrivedStates[opposite] && distanceScrollState[opposite]) {
    distanceScrollState[opposite] = false
  }
}

function handleScroll() {
  const wrap = wrapRef.value
  if (!wrap) return

  handleBarScroll(wrap)

  const prevTop = wrapScrollTop
  const prevLeft = wrapScrollLeft
  wrapScrollTop = wrap.scrollTop
  wrapScrollLeft = wrap.scrollLeft

  const arrivedStates: Record<ScrollbarDirection, boolean> = {
    bottom: !(wrap.scrollHeight - props.distance > wrap.clientHeight + wrapScrollTop),
    top: wrapScrollTop <= props.distance && prevTop !== 0,
    right:
      !(wrap.scrollWidth - props.distance > wrap.clientWidth + wrapScrollLeft) &&
      prevLeft !== wrapScrollLeft,
    left: wrapScrollLeft <= props.distance && prevLeft !== 0,
  }

  emit('scroll', {
    scrollTop: wrapScrollTop,
    scrollLeft: wrapScrollLeft,
  })

  if (prevTop !== wrapScrollTop) {
    direction = wrapScrollTop > prevTop ? 'bottom' : 'top'
  }
  if (prevLeft !== wrapScrollLeft) {
    direction = wrapScrollLeft > prevLeft ? 'right' : 'left'
  }

  if (props.distance > 0) {
    if (!direction || distanceScrollState[direction]) return
    updateTriggerStatus(arrivedStates)
  }

  if (direction && arrivedStates[direction]) emit('end', direction)
}

function scrollTo(xCord: number, yCord?: number): void
function scrollTo(options: ScrollToOptions): void
function scrollTo(arg1: unknown, arg2?: number) {
  const wrap = wrapRef.value
  if (!wrap) return

  if (typeof arg1 === 'object' && arg1 !== null) {
    wrap.scrollTo(arg1 as ScrollToOptions)
  } else if (typeof arg1 === 'number' && typeof arg2 === 'number') {
    wrap.scrollTo(arg1, arg2)
  }
}

function setScrollTop(value: number) {
  if (wrapRef.value) wrapRef.value.scrollTop = value
}

function setScrollLeft(value: number) {
  if (wrapRef.value) wrapRef.value.scrollLeft = value
}

function handleTrackMouseDown(axis: 'X' | 'Y', event: MouseEvent) {
  const wrap = wrapRef.value
  const bar = barElement(axis)
  const thumb = thumbElement(axis)
  if (!wrap || !bar || !thumb) return

  const info = barInfo(axis)
  const offset = Math.abs(
    (event.target as HTMLElement).getBoundingClientRect()[info.direction] - event[info.client],
  )
  const thumbHalf = thumb[info.offset] / 2
  const offsetRatio =
    bar[info.offset] ** 2 / wrap[info.scrollSize] / ratio(axis) / thumb[info.offset]
  const thumbPositionPercentage = ((offset - thumbHalf) * 100 * offsetRatio) / bar[info.offset]

  if (!Number.isFinite(thumbPositionPercentage)) return
  wrap[info.scroll] = (thumbPositionPercentage * wrap[info.scrollSize]) / 100
}

function handleThumbMouseDown(axis: 'X' | 'Y', event: MouseEvent) {
  event.stopPropagation()
  if (event.ctrlKey || [1, 2].includes(event.button)) return

  window.getSelection()?.removeAllRanges()
  startDrag(axis)

  const thumb = thumbElement(axis)
  if (!thumb) return

  const info = barInfo(axis)
  thumbState[axis] =
    thumb[info.offset] - (event[info.client] - thumb.getBoundingClientRect()[info.direction])
}

function startDrag(axis: 'X' | 'Y') {
  const wrap = wrapRef.value
  if (!wrap) return

  cursorDown = true
  draggingAxis = axis
  dragging.value = axis
  baseScrollHeight = wrap.scrollHeight
  baseScrollWidth = wrap.scrollWidth

  document.addEventListener('mousemove', handleDocumentMouseMove)
  document.addEventListener('mouseup', handleDocumentMouseUp)
  document.addEventListener('selectstart', preventSelection)
}

function preventSelection(event: Event) {
  event.preventDefault()
}

function handleDocumentMouseMove(event: MouseEvent) {
  if (!cursorDown || !draggingAxis) return

  const axis = draggingAxis
  const wrap = wrapRef.value
  const bar = barElement(axis)
  const thumb = thumbElement(axis)
  if (!wrap || !bar || !thumb) return

  const prevPage = thumbState[axis]
  if (!prevPage) return

  const info = barInfo(axis)
  const offset = (bar.getBoundingClientRect()[info.direction] - event[info.client]) * -1
  const thumbClickPosition = thumb[info.offset] - prevPage
  const offsetRatio =
    bar[info.offset] ** 2 / wrap[info.scrollSize] / ratio(axis) / thumb[info.offset]
  const thumbPositionPercentage =
    ((offset - thumbClickPosition) * 100 * offsetRatio) / bar[info.offset]

  if (!Number.isFinite(thumbPositionPercentage)) return
  wrap[info.scroll] =
    (thumbPositionPercentage * (axis === 'X' ? baseScrollWidth : baseScrollHeight)) / 100
}

function handleDocumentMouseUp() {
  const axis = draggingAxis
  cursorDown = false
  draggingAxis = null
  dragging.value = null
  if (axis) thumbState[axis] = 0

  document.removeEventListener('mousemove', handleDocumentMouseMove)
  document.removeEventListener('mouseup', handleDocumentMouseUp)
  document.removeEventListener('selectstart', preventSelection)

  if (cursorLeave) {
    visibleX.value = false
    visibleY.value = false
  }
}

function handleRootMouseEnter() {
  cursorInside = true
  cursorLeave = false
  syncBarVisibility()
}

function handleRootMouseLeave() {
  cursorInside = false
  cursorLeave = true
  visibleX.value = cursorDown
  visibleY.value = cursorDown
}

function stopResizeObservers() {
  resizeObserver?.disconnect()
  resizeObserver = undefined
  if (typeof window !== 'undefined') window.removeEventListener('resize', update)
}

function startResizeObservers() {
  if (typeof window === 'undefined') return
  stopResizeObservers()
  if (props.noresize) return

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(update)
    // One observer can watch both nodes; the scrollbar depends on the viewport
    // and the content size, and either can change independently.
    if (viewRef.value) resizeObserver.observe(viewRef.value)
    if (wrapRef.value) resizeObserver.observe(wrapRef.value)
  } else {
    // Only fall back to window resize when ResizeObserver is unavailable.
    window.addEventListener('resize', update)
  }
}

watch(
  () => props.noresize,
  () => startResizeObservers(),
)

watch(
  () => [props.height, props.maxHeight],
  () => {
    if (!props.native) nextTick(update)
  },
)

onMounted(() => {
  startResizeObservers()
  if (!props.native) nextTick(update)
})

onActivated(() => {
  const wrap = wrapRef.value
  if (!wrap) return
  wrap.scrollTop = wrapScrollTop
  wrap.scrollLeft = wrapScrollLeft
})

onBeforeUnmount(() => {
  stopResizeObservers()
  document.removeEventListener('mousemove', handleDocumentMouseMove)
  document.removeEventListener('mouseup', handleDocumentMouseUp)
  document.removeEventListener('selectstart', preventSelection)
})

defineExpose({
  /** The scrollable wrapper element. */
  wrapRef,
  /** Recalculate thumb sizes and positions. */
  update,
  /** Scroll to coordinates or a ScrollToOptions object. */
  scrollTo,
  /** Set the vertical scroll position. */
  setScrollTop,
  /** Set the horizontal scroll position. */
  setScrollLeft,
  /** Synchronise scrollbar state with the current scroll position. */
  handleScroll,
})
</script>

<template>
  <div class="w-scrollbar" @mouseenter="handleRootMouseEnter" @mouseleave="handleRootMouseLeave">
    <div
      ref="wrapRef"
      :class="mergedWrapClass"
      :style="mergedWrapStyle"
      tabindex="0"
      @scroll="handleScroll"
    >
      <component
        :is="tag"
        :id="props.id"
        ref="viewRef"
        class="w-scrollbar__view"
        :class="props.classes?.view"
        :style="props.styles?.view"
      >
        <slot />
      </component>
    </div>

    <template v-if="!props.native">
      <div
        ref="horizontalBarRef"
        class="w-scrollbar__bar is-horizontal"
        @mousedown="handleTrackMouseDown('X', $event)"
      >
        <div
          v-show="props.always || visibleX"
          ref="horizontalThumbRef"
          class="w-scrollbar__thumb"
          :class="{ 'is-dragging': dragging === 'X' }"
          :style="horizontalThumbStyle"
          @mousedown="handleThumbMouseDown('X', $event)"
          @click.stop
        />
      </div>

      <div
        ref="verticalBarRef"
        class="w-scrollbar__bar is-vertical"
        @mousedown="handleTrackMouseDown('Y', $event)"
      >
        <div
          v-show="props.always || visibleY"
          ref="verticalThumbRef"
          class="w-scrollbar__thumb"
          :class="{ 'is-dragging': dragging === 'Y' }"
          :style="verticalThumbStyle"
          @mousedown="handleThumbMouseDown('Y', $event)"
          @click.stop
        />
      </div>
    </template>
  </div>
</template>
