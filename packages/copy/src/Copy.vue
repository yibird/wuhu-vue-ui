<script setup lang="ts">
import { computed, onBeforeUnmount, readonly, ref } from 'vue'
import type { CopyProps, CopySlotProps } from './types'
import { useClipboard } from './useClipboard'

defineOptions({
  name: 'WCopy',
})

const props = withDefaults(defineProps<CopyProps>(), {
  disabled: false,
  ariaLabel: '复制',
  duration: 1800,
  showIcon: true,
})

const emit = defineEmits<{
  success: [text: string]
  error: [error: Error]
}>()

defineSlots<{
  default?: (props: CopySlotProps) => unknown
  prefix?: () => unknown
  suffix?: () => unknown
}>()

const {
  copied,
  loading: clipboardLoading,
  error,
  copy,
  reset,
} = useClipboard({
  duration: () => props.duration,
  onSuccess: (text) => emit('success', text),
  onError: (cause) => emit('error', cause),
})

const resolving = ref(false)
let unmounted = false
// Bumped whenever the current attempt should be abandoned (reset or unmount).
let requestId = 0
const loading = computed(() => resolving.value || clipboardLoading.value)
const isDisabled = computed(() => props.disabled || loading.value)
const liveMessage = computed(() => (copied.value ? '已复制' : ''))
const rootClasses = computed(() => ({
  'is-copied': copied.value,
  'is-loading': loading.value,
  'is-disabled': isDisabled.value,
  'has-icon': props.showIcon,
}))

function resetState() {
  requestId += 1
  resolving.value = false
  reset()
}

async function handleCopy(): Promise<boolean> {
  if (props.disabled || loading.value) return false

  const currentRequest = ++requestId
  let text: string | undefined
  resolving.value = true

  try {
    text = props.text ? await props.text() : undefined
  } catch (cause) {
    if (unmounted || currentRequest !== requestId) return false
    // A previous success may still be showing; any failure clears it and its
    // pending timer before reporting the error.
    resetState()
    const nextError = cause instanceof Error ? cause : new Error(String(cause))
    error.value = nextError
    emit('error', nextError)
    return false
  } finally {
    if (currentRequest === requestId) resolving.value = false
  }

  if (unmounted || currentRequest !== requestId) return false

  if (typeof text !== 'string') {
    resetState()
    const nextError = new Error('Copy requires a `text` function that returns a string')
    error.value = nextError
    emit('error', nextError)
    return false
  }

  return copy(text)
}

const slotProps = computed<CopySlotProps>(() => ({
  copied: copied.value,
  loading: loading.value,
  error: error.value,
  copy: handleCopy,
}))

onBeforeUnmount(() => {
  unmounted = true
  requestId += 1
  resolving.value = false
})

defineExpose({
  copied: readonly(copied),
  loading: readonly(loading),
  error: readonly(error),
  copy: handleCopy,
  reset: resetState,
})
</script>

<template>
  <span class="w-copy" :class="rootClasses">
    <slot name="prefix" />

    <span
      v-if="showIcon"
      class="w-copy__trigger w-copy__trigger--icon"
      role="button"
      :aria-label="ariaLabel"
      :tabindex="isDisabled ? -1 : 0"
      :aria-disabled="isDisabled ? 'true' : undefined"
      @click="handleCopy"
      @keydown.enter.prevent="handleCopy"
      @keydown.space.prevent="handleCopy"
    >
      <span class="w-copy__icon" aria-hidden="true">
        <svg v-if="loading" viewBox="0 0 24 24" fill="none" class="w-copy__spinner">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" opacity="0.25" />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <svg v-else-if="copied" viewBox="0 0 24 24" fill="none">
          <path
            d="m5 12.5 4.2 4.2L19 6.9"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none">
          <rect
            x="9"
            y="9"
            width="10"
            height="11"
            rx="2"
            stroke="currentColor"
            stroke-width="1.8"
          />
          <path
            d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
      </span>
    </span>

    <button v-else type="button" class="w-copy__trigger" :disabled="isDisabled" @click="handleCopy">
      <slot v-bind="slotProps" />
    </button>

    <template v-if="showIcon">
      <slot name="suffix">
        <slot v-bind="slotProps" />
      </slot>
    </template>
    <slot v-else name="suffix" />

    <span class="w-copy__live" aria-live="polite">{{ liveMessage }}</span>
  </span>
</template>
