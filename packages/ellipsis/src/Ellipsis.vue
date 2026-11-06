<script setup lang="ts">
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useId, watch } from 'vue'
import type { EllipsisActionSlotProps, EllipsisProps, EllipsisTooltipSlotProps } from './types'

const props = withDefaults(defineProps<EllipsisProps>(), {
  text: '',
  lines: 1,
  expandable: false,
  expanded: false,
  tooltip: false,
  tooltipPlacement: 'top',
  tag: 'div',
})

const emit = defineEmits<{
  'update:expanded': [expanded: boolean]
  expand: []
  collapse: []
}>()

defineSlots<{
  default?: () => unknown
  action?: (props: EllipsisActionSlotProps) => unknown
  tooltip?: (props: EllipsisTooltipSlotProps) => unknown
}>()

const contentRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)
const expanded = ref(props.expanded)
const overflowed = ref(false)
const tooltipVisible = ref(false)
const tooltipId = useId()

let observer: ResizeObserver | undefined
let unmounted = false

const lineCount = computed(() => Math.max(1, Math.floor(props.lines)))
const contentText = computed(() => props.text ?? '')
const showAction = computed(() => props.expandable && overflowed.value)
const showTooltip = computed(() => props.tooltip && overflowed.value && !expanded.value)

const rootClasses = computed(() => ({
  'is-expanded': expanded.value,
  'is-overflowed': overflowed.value,
  'has-action': showAction.value,
}))

const contentClasses = computed(() => ({
  'is-expanded': expanded.value,
}))

const contentStyle = computed<Record<string, string>>(() => ({
  '--w-ellipsis-lines': String(lineCount.value),
}))

const actionSlotProps = computed<EllipsisActionSlotProps>(() => ({
  expanded: expanded.value,
  toggle,
  overflowed: overflowed.value,
}))

const tooltipSlotProps = computed<EllipsisTooltipSlotProps>(() => ({
  text: contentText.value,
}))

// Floating UI owns tooltip placement, flipping and viewport shifting, so the
// component does not need to duplicate those rules in CSS.
const { floatingStyles, placement } = useFloating(contentRef, tooltipRef, {
  placement: () => props.tooltipPlacement,
  middleware: [offset(6), flip(), shift({ padding: 8 })],
  whileElementsMounted: autoUpdate,
})

/**
 * Reads the intrinsic overflow while the clamp is active. An expanded element
 * is temporarily re-clamped synchronously and restored before the browser can
 * paint, so no visual jump occurs and the ResizeObserver sees a net-zero
 * change.
 */
function measureOverflow() {
  const element = contentRef.value
  if (!element) return

  if (!expanded.value) {
    overflowed.value = element.scrollHeight > element.clientHeight + 1
    return
  }

  const { display, overflow, webkitLineClamp } = element.style
  element.style.display = '-webkit-box'
  element.style.overflow = 'hidden'
  element.style.webkitLineClamp = String(lineCount.value)

  try {
    overflowed.value = element.scrollHeight > element.clientHeight + 1
  } finally {
    element.style.display = display
    element.style.overflow = overflow
    element.style.webkitLineClamp = webkitLineClamp
  }
}

function scheduleMeasure() {
  nextTick(() => {
    if (!unmounted) measureOverflow()
  })
}

function toggle() {
  const next = !expanded.value
  expanded.value = next
  emit('update:expanded', next)
  if (next) {
    emit('expand')
  } else {
    emit('collapse')
    // Re-check overflow once the clamp is active again.
    scheduleMeasure()
  }
}

function handleMouseEnter() {
  if (showTooltip.value) tooltipVisible.value = true
}

function handleFocusIn() {
  if (showTooltip.value) tooltipVisible.value = true
}

function hideTooltip() {
  tooltipVisible.value = false
}

function handleFocusOut(event: FocusEvent) {
  const nextTarget = event.relatedTarget as Node | null
  if (!nextTarget || !contentRef.value?.contains(nextTarget)) {
    hideTooltip()
  }
}

watch(
  () => props.expanded,
  (value) => {
    expanded.value = value
  },
)

watch(expanded, scheduleMeasure)
watch([() => props.text, lineCount], scheduleMeasure)
watch(showTooltip, (value) => {
  if (!value) hideTooltip()
})

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined' && contentRef.value) {
    observer = new ResizeObserver(measureOverflow)
    observer.observe(contentRef.value)
  }
  measureOverflow()
})

onUpdated(() => {
  scheduleMeasure()
})

onBeforeUnmount(() => {
  unmounted = true
  observer?.disconnect()
  observer = undefined
})
</script>

<template>
  <component :is="tag" class="w-ellipsis" :class="rootClasses">
    <div
      ref="contentRef"
      class="w-ellipsis__content"
      :class="contentClasses"
      :style="contentStyle"
      :tabindex="showTooltip ? 0 : undefined"
      :aria-describedby="showTooltip ? tooltipId : undefined"
      @mouseenter="handleMouseEnter"
      @mouseleave="hideTooltip"
      @focusin="handleFocusIn"
      @focusout="handleFocusOut"
    >
      <slot>{{ contentText }}</slot>
    </div>

    <button
      v-if="showAction"
      type="button"
      class="w-ellipsis__action"
      :aria-expanded="expanded ? 'true' : 'false'"
      @click="toggle"
    >
      <slot name="action" v-bind="actionSlotProps">
        {{ expanded ? '收起' : '展开' }}
      </slot>
    </button>

    <div
      v-if="showTooltip && tooltipVisible"
      ref="tooltipRef"
      :id="tooltipId"
      class="w-ellipsis__tooltip"
      :class="`w-ellipsis__tooltip--${placement}`"
      :style="floatingStyles"
      role="tooltip"
    >
      <slot name="tooltip" v-bind="tooltipSlotProps">{{ contentText }}</slot>
    </div>
  </component>
</template>
