<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  readonly,
  ref,
  shallowReadonly,
  shallowRef,
  watch,
  type Ref,
  type ShallowRef,
} from 'vue'
import type { LazyContainerChangeEvent, LazyContainerProps, LazyContainerSlotProps } from './types'

defineOptions({
  name: 'WLazyContainer',
})

const props = withDefaults(defineProps<LazyContainerProps>(), {
  root: null,
  rootMargin: '0px',
  threshold: 0,
  once: false,
})

const emit = defineEmits<{
  enter: [event: LazyContainerChangeEvent]
  leave: [event: LazyContainerChangeEvent]
  change: [event: LazyContainerChangeEvent]
}>()

defineSlots<{
  default?: (props: LazyContainerSlotProps) => unknown
  placeholder?: (props: LazyContainerSlotProps) => unknown
}>()

const rootRef = ref<HTMLElement>()
const isVisible = ref(false)
const hasEntered = ref(false)
const entry = shallowRef<IntersectionObserverEntry | null>(null)
let observer: IntersectionObserver | undefined

const shouldRender = computed(() => hasEntered.value)

const slotProps = computed<LazyContainerSlotProps>(() => ({
  isVisible: isVisible.value,
  hasEntered: hasEntered.value,
  entry: entry.value,
}))

function markVisible() {
  isVisible.value = true
  hasEntered.value = true
}

function handleIntersection(entries: IntersectionObserverEntry[]) {
  const nextEntry = entries[entries.length - 1]
  if (!nextEntry) return

  const wasVisible = isVisible.value
  const nextVisible = nextEntry.isIntersecting

  entry.value = nextEntry
  isVisible.value = nextVisible
  if (nextVisible) hasEntered.value = true

  const payload: LazyContainerChangeEvent = {
    isIntersecting: nextVisible,
    entry: nextEntry,
  }

  if (nextVisible !== wasVisible) {
    if (nextVisible) emit('enter', payload)
    else emit('leave', payload)
    emit('change', payload)
  }

  if (props.once && nextVisible) disconnect()
}

function disconnect() {
  observer?.disconnect()
  observer = undefined
}

function observe() {
  disconnect()

  if (typeof IntersectionObserver === 'undefined' || !rootRef.value) {
    markVisible()
    return
  }

  // A fresh observation has not reported visibility yet: keep hasEntered (the
  // content already rendered) but reset the transient visibility state so the
  // first real intersection after re-enabling emits `enter`, and a first
  // non-intersecting entry does not emit a spurious `leave`.
  isVisible.value = false

  observer = new IntersectionObserver(handleIntersection, {
    root: props.root as Element | Document | null,
    rootMargin: props.rootMargin,
    threshold: props.threshold,
  })
  observer.observe(rootRef.value)
}

/** Compare threshold arrays by value so a new but equal array is a no-op. */
function serializeThreshold(value: number | number[]): string {
  return Array.isArray(value) ? value.join(',') : String(value)
}

const thresholdKey = computed(() => serializeThreshold(props.threshold))

// `once` is read inside handleIntersection, so it does not need to rebuild the
// observer when it changes.
watch([() => props.root, () => props.rootMargin, thresholdKey], () => observe())

onMounted(() => {
  observe()
})

onBeforeUnmount(() => {
  disconnect()
})

interface LazyContainerExpose {
  isVisible: Readonly<Ref<boolean>>
  hasEntered: Readonly<Ref<boolean>>
  entry: Readonly<ShallowRef<IntersectionObserverEntry | null>>
  observe: () => void
  disconnect: () => void
}

defineExpose<LazyContainerExpose>({
  isVisible: readonly(isVisible),
  hasEntered: readonly(hasEntered),
  entry: shallowReadonly(entry),
  observe,
  disconnect,
})
</script>

<template>
  <div ref="rootRef" class="w-lazy-container">
    <slot v-if="shouldRender" v-bind="slotProps" />
    <slot v-else name="placeholder" v-bind="slotProps">
      <span class="w-lazy-container__placeholder" aria-hidden="true" />
    </slot>
  </div>
</template>
