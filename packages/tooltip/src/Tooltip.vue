<script setup lang="ts">
import { autoUpdate, useFloating } from '@floating-ui/vue'
import { computed, onBeforeUnmount, ref, useId, useSlots, watch } from 'vue'
import { addDescribedBy, removeDescribedBy, resolveTheme } from './a11y'
import { createTooltipMiddleware } from './positioning'
import type { TooltipContentSlotProps, TooltipProps } from './types'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<TooltipProps>(), {
  content: undefined,
  placement: 'top',
  offset: 8,
  showDelay: 0,
  hideDelay: 0,
  disabled: false,
  // Keep `undefined` so Vue's boolean casting does not force the tooltip closed.
  open: undefined,
  anchor: undefined,
  teleport: true,
  teleportTo: 'body',
})

const emit = defineEmits<{
  'update:open': [open: boolean]
}>()

const slots = useSlots()

defineSlots<{
  default?: () => unknown
  content?: (props: TooltipContentSlotProps) => unknown
}>()

const tooltipId = useId()
const triggerRef = ref<HTMLElement | null>(null)
const floatingRef = ref<HTMLElement | null>(null)
const internalOpen = ref(false)
const mirroredTheme = ref<string | null>(null)

let showTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined
let describedElement: HTMLElement | null = null

const isAnchorMode = computed(() => props.anchor != null)
const reference = computed(() => props.anchor ?? triggerRef.value)
const hasContent = computed(() => Boolean(props.content) || Boolean(slots.content))
const visible = computed(() => {
  if (props.disabled || !hasContent.value) return false
  if (props.open !== undefined) return props.open
  return isAnchorMode.value ? true : internalOpen.value
})

const slotProps = computed<TooltipContentSlotProps>(() => ({ content: props.content }))

const { floatingStyles, placement } = useFloating(reference, floatingRef, {
  open: visible,
  placement: () => props.placement,
  strategy: 'fixed',
  middleware: createTooltipMiddleware(() => props.offset),
  whileElementsMounted: autoUpdate,
})

function clearTimers() {
  if (showTimer !== undefined) {
    clearTimeout(showTimer)
    showTimer = undefined
  }
  if (hideTimer !== undefined) {
    clearTimeout(hideTimer)
    hideTimer = undefined
  }
}

function setOpen(next: boolean) {
  clearTimers()
  if (internalOpen.value === next) return
  internalOpen.value = next
  emit('update:open', next)
}

function requestShow() {
  if (props.disabled) return
  clearTimers()
  if (props.showDelay > 0) {
    showTimer = setTimeout(() => {
      showTimer = undefined
      setOpen(true)
    }, props.showDelay)
  } else {
    setOpen(true)
  }
}

function requestHide() {
  clearTimers()
  if (props.hideDelay > 0) {
    hideTimer = setTimeout(() => {
      hideTimer = undefined
      setOpen(false)
    }, props.hideDelay)
  } else {
    setOpen(false)
  }
}

function handlePointerEnter() {
  requestShow()
}

function handlePointerLeave() {
  requestHide()
}

function handleFocusIn() {
  requestShow()
}

function handleFocusOut(event: FocusEvent) {
  const nextTarget = event.relatedTarget as Node | null
  if (nextTarget && triggerRef.value?.contains(nextTarget)) return
  requestHide()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !visible.value) return
  setOpen(false)
}

function syncDescribedBy() {
  const next = visible.value ? reference.value : null

  if (describedElement && describedElement !== next) {
    removeDescribedBy(describedElement, tooltipId)
  }

  if (next) {
    addDescribedBy(next, tooltipId)
  }

  describedElement = next ?? null
}

watch([visible, reference], syncDescribedBy, { flush: 'post', immediate: true })

watch(visible, (value) => {
  if (value) {
    mirroredTheme.value = resolveTheme(reference.value)
  }
})

watch(visible, (value) => {
  if (typeof document === 'undefined') return
  if (value) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})

onBeforeUnmount(() => {
  clearTimers()
  if (describedElement) {
    removeDescribedBy(describedElement, tooltipId)
    describedElement = null
  }
  if (typeof document !== 'undefined') {
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<template>
  <span
    v-if="!isAnchorMode"
    ref="triggerRef"
    class="w-tooltip__trigger"
    v-bind="$attrs"
    @pointerenter="handlePointerEnter"
    @pointerleave="handlePointerLeave"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <slot />
  </span>

  <Teleport :to="teleportTo" :disabled="!teleport">
    <div
      v-if="visible"
      :id="tooltipId"
      ref="floatingRef"
      class="w-tooltip"
      role="tooltip"
      :data-placement="placement"
      :data-w-theme="mirroredTheme ?? undefined"
      :style="floatingStyles"
    >
      <slot name="content" v-bind="slotProps">{{ content }}</slot>
    </div>
  </Teleport>
</template>
