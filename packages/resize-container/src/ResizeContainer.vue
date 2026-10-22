<script setup lang="ts">
import { useResize } from '@wuhu-ui/core'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowReadonly,
  useAttrs,
  watch,
  type ComputedRef,
  type ShallowRef,
} from 'vue'
import type {
  ResizeContainerProps,
  ResizeContainerResizeEvent,
  ResizeContainerSlotProps,
} from './types'

defineOptions({
  name: 'WResizeContainer',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ResizeContainerProps>(), {
  box: 'content-box',
  debounce: 0,
  immediate: true,
  disabled: false,
  tag: 'div',
})

const emit = defineEmits<{
  resize: [event: ResizeContainerResizeEvent]
}>()

defineSlots<{
  default?: (props: ResizeContainerSlotProps) => unknown
}>()

const attrs = useAttrs()
const rootRef = ref<HTMLElement>()

/**
 * Fallthrough attrs without `style`: inline styles are managed separately so
 * a re-render does not overwrite styles written by the browser at runtime
 * (for example during a native resize drag).
 */
const attrsWithoutStyle = computed(() => {
  const result: Record<string, unknown> = {}
  for (const key in attrs) {
    if (key !== 'style') result[key] = attrs[key]
  }
  return result
})

// SSR cannot run `applyDeclaredStyle`, so keep the style attribute in the
// server-rendered markup. On the client it is managed imperatively.
const attrsForRender = computed(() =>
  typeof window === 'undefined' ? attrs : attrsWithoutStyle.value,
)

/**
 * Declared inline style is applied directly to the DOM instead of being part
 * of the vnode props. Vue re-applies a bound style on every render (the
 * optimized STYLE patch flag does not compare references), which overwrites
 * sizes the browser writes during a native resize. Tracking the last declared
 * values lets us patch only keys whose declaration actually changed, leaving
 * runtime-written values untouched.
 */
let declaredStyleValues: Record<string, string> = {}

const hyphenate = (value: string) => value.replace(/\B([A-Z])/g, '-$1').toLowerCase()

function parseStyleString(value: string): Record<string, string> {
  const result: Record<string, string> = {}

  for (const declaration of value.split(';')) {
    const separator = declaration.indexOf(':')
    if (separator <= 0) continue

    const key = declaration.slice(0, separator).trim()
    const item = declaration.slice(separator + 1).trim()
    if (key && item) result[key] = item
  }

  return result
}

const UNITLESS_PROPERTIES = new Set([
  'animation-iteration-count',
  'aspect-ratio',
  'border-image-outset',
  'border-image-slice',
  'border-image-width',
  'column-count',
  'flex',
  'flex-grow',
  'flex-shrink',
  'font-weight',
  'grid-column',
  'grid-row',
  'line-height',
  'opacity',
  'order',
  'orphans',
  'scale',
  'tab-size',
  'widows',
  'z-index',
  'zoom',
])

function styleValueToCss(key: string, value: unknown): string {
  if (typeof value !== 'number') return String(value)

  const property = key.includes('-') ? key : key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
  return UNITLESS_PROPERTIES.has(property) ? String(value) : `${value}px`
}

function readDeclaredStyleValues(value: unknown): Record<string, string> {
  if (value == null) return {}
  if (typeof value === 'string') return parseStyleString(value)

  if (Array.isArray(value)) {
    const result: Record<string, string> = {}
    for (const item of value) Object.assign(result, readDeclaredStyleValues(item))
    return result
  }

  if (typeof value === 'object') {
    const result: Record<string, string> = {}
    for (const key in value) {
      const item = (value as Record<string, unknown>)[key]
      if (item != null) result[key] = styleValueToCss(key, item)
    }
    return result
  }

  return {}
}

function setStyleValue(element: HTMLElement, key: string, value: string) {
  const importantIndex = value.toLowerCase().indexOf('!important')
  const property = key.startsWith('--') || key.includes('-') ? key : hyphenate(key)

  if (importantIndex >= 0) {
    element.style.setProperty(property, value.slice(0, importantIndex).trim(), 'important')
    return
  }

  if (property.includes('-')) {
    element.style.setProperty(property, value)
  } else {
    ;(element.style as unknown as Record<string, string>)[property] = value
  }
}

function removeStyleValue(element: HTMLElement, key: string) {
  const property = key.startsWith('--') || key.includes('-') ? key : hyphenate(key)
  element.style.removeProperty(property)
}

function applyDeclaredStyle() {
  const nextValues = readDeclaredStyleValues(attrs.style)
  const previous = declaredStyleValues

  const keys = new Set([...Object.keys(previous), ...Object.keys(nextValues)])
  let changed = false
  for (const key of keys) {
    if (previous[key] !== nextValues[key]) {
      changed = true
      break
    }
  }
  if (!changed) return

  declaredStyleValues = nextValues
  const element = rootRef.value
  if (!element) return

  for (const key in previous) {
    if (!(key in nextValues)) removeStyleValue(element, key)
  }
  for (const key in nextValues) {
    if (previous[key] !== nextValues[key]) setStyleValue(element, key, nextValues[key])
  }
}

watch(() => attrs.style, applyDeclaredStyle, { deep: true })

const size = reactive({ width: 0, height: 0 })

function createPayload(
  record: ResizeObserverEntry | null,
  measuredSize: { width: number; height: number },
): ResizeContainerResizeEvent {
  const contentRect =
    record?.contentRect ?? new DOMRectReadOnly(0, 0, measuredSize.width, measuredSize.height)

  return {
    ...measuredSize,
    contentRect,
    borderBoxSize: record?.borderBoxSize ?? null,
    contentBoxSize: record?.contentBoxSize ?? null,
    devicePixelContentBoxSize: record?.devicePixelContentBoxSize ?? null,
    entry: record,
  }
}

const { width, height, entry, start, stop, measure } = useResize(rootRef, {
  box: () => props.box,
  debounce: () => props.debounce,
  disabled: () => props.disabled,
  immediate: () => props.immediate,
  onResize: (measuredSize, record) => {
    if (props.disabled || !rootRef.value) return

    const payload = createPayload(record, measuredSize)
    size.width = payload.width
    size.height = payload.height
    emit('resize', payload)
  },
})

const slotProps = computed<ResizeContainerSlotProps>(() => ({
  width: size.width,
  height: size.height,
  entry: entry.value,
}))

watch(
  () => props.tag,
  () => {
    nextTick(() => {
      // The new root element has none of the declared styles yet.
      declaredStyleValues = {}
      applyDeclaredStyle()
    })
  },
)

watch(
  () => props.immediate,
  (value) => {
    if (value) {
      nextTick(() => {
        if (!props.disabled) measure()
      })
    }
  },
)

onMounted(() => {
  applyDeclaredStyle()
})

onBeforeUnmount(() => {
  stop()
})

interface ResizeContainerExpose {
  width: ComputedRef<number>
  height: ComputedRef<number>
  entry: Readonly<ShallowRef<ResizeObserverEntry | null>>
  start: () => void
  stop: () => void
  measure: () => void
}

defineExpose<ResizeContainerExpose>({
  width: computed(() => width.value),
  height: computed(() => height.value),
  entry: shallowReadonly(entry),
  start,
  stop,
  measure,
})
</script>

<template>
  <component :is="tag" ref="rootRef" class="w-resize-container" v-bind="attrsForRender">
    <slot v-bind="slotProps" />
  </component>
</template>
