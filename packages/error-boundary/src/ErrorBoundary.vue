<script setup lang="ts">
import { computed, nextTick, onErrorCaptured, readonly, ref, shallowRef, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { ErrorBoundaryErrorEvent, ErrorBoundaryProps, ErrorBoundarySlotProps } from './types'

defineOptions({
  name: 'WErrorBoundary',
})

const props = withDefaults(defineProps<ErrorBoundaryProps>(), {
  tag: 'div',
  title: '页面组件运行出错',
  description: '你可以重试，或联系管理员查看错误详情。',
  showDetails: false,
  showReset: true,
  resetText: '重新加载',
  propagate: false,
})

const emit = defineEmits<{
  error: [event: ErrorBoundaryErrorEvent]
  reset: []
}>()

defineSlots<{
  default?: () => unknown
  fallback?: (props: ErrorBoundarySlotProps) => unknown
}>()

const failed = ref(false)
const error = shallowRef<unknown>(null)
const info = ref('')
const instance = shallowRef<ComponentPublicInstance | null>(null)
const renderKey = ref(0)
const fallbackRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()

const errorMessage = computed(() => {
  const value = error.value
  if (value instanceof Error) return value.message
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return '未知错误'

  try {
    return JSON.stringify(value) || String(value)
  } catch {
    return String(value)
  }
})

const slotProps = computed<ErrorBoundarySlotProps>(() => ({
  error: error.value,
  info: info.value,
  instance: instance.value,
  reset,
}))

onErrorCaptured((capturedError, capturedInstance, capturedInfo) => {
  failed.value = true
  error.value = capturedError
  info.value = capturedInfo
  instance.value = capturedInstance
  emit('error', {
    error: capturedError,
    info: capturedInfo,
    instance: capturedInstance,
  })

  nextTick(() => fallbackRef.value?.focus({ preventScroll: true }))

  return props.propagate ? undefined : false
})

function reset() {
  const wasFailed = failed.value
  failed.value = false
  error.value = null
  info.value = ''
  instance.value = null
  renderKey.value += 1

  if (wasFailed) {
    // The focused fallback is removed during the reset; move focus to the
    // recovered content instead of letting it fall back to <body>.
    nextTick(() => contentRef.value?.focus({ preventScroll: true }))
  }

  emit('reset')
}

watch(
  () => props.resetOn,
  () => {
    if (failed.value) reset()
  },
  { deep: true },
)

defineExpose({
  failed: readonly(failed),
  error: readonly(error),
  info: readonly(info),
  reset,
})
</script>

<template>
  <component :is="tag" class="w-error-boundary">
    <div
      v-if="failed"
      key="w-error-boundary-fallback"
      ref="fallbackRef"
      class="w-error-boundary__fallback-container"
      role="alert"
      tabindex="-1"
    >
      <slot name="fallback" v-bind="slotProps">
        <div class="w-error-boundary__fallback">
          <div class="w-error-boundary__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" />
              <path
                d="M12 7.5v5.2M12 16.5v.1"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <h3 class="w-error-boundary__title">{{ title }}</h3>
          <p class="w-error-boundary__description">{{ description }}</p>
          <pre v-if="showDetails" class="w-error-boundary__details">{{ errorMessage }}</pre>
          <button v-if="showReset" type="button" class="w-error-boundary__reset" @click="reset">
            {{ resetText }}
          </button>
        </div>
      </slot>
    </div>
    <div
      v-else
      :key="`w-error-boundary-content-${renderKey}`"
      ref="contentRef"
      class="w-error-boundary__content"
      tabindex="-1"
    >
      <slot />
    </div>
  </component>
</template>
