<script setup lang="ts">
import { useResize } from '@wuhu-vue-ui/core'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  reactive,
  ref,
  shallowReadonly,
  useAttrs,
  watch,
  type ShallowRef,
} from 'vue'
import type {
  ResizeContainerProps,
  ResizeContainerResizeEvent,
  ResizeContainerSize,
  ResizeContainerSlotProps,
} from './types'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ResizeContainerProps>(), {
  box: 'content-box',
  debounce: 0,
  immediate: true,
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
// server-rendered markup. On the client the first render also keeps it so the
// element never paints unstyled; after mount the style is managed imperatively.
const hasMounted = ref(false)
const attrsForRender = computed(() =>
  typeof window === 'undefined' || !hasMounted.value ? attrs : attrsWithoutStyle.value,
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

/**
 * Converts a camelCase style key to its CSS spelling, including vendor
 * prefixes: `webkitTransform` -> `-webkit-transform`, `msTransform` ->
 * `-ms-transform`.
 */
const hyphenate = (value: string) => {
  const hyphenated = value.replace(/([A-Z])/g, '-$1').toLowerCase()
  return hyphenated.replace(/^(webkit|moz|ms|o)-/, '-$1-')
}

function parseStyleString(value: string): Record<string, string> {
  const style = document.createElement('div').style
  style.cssText = value
  const result: Record<string, string> = {}

  for (let index = 0; index < style.length; index += 1) {
    const key = style.item(index)
    const item = style.getPropertyValue(key)
    result[key] = style.getPropertyPriority(key) ? `${item} !important` : item
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

  const property = key.startsWith('--') ? key : hyphenate(key)
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
  const property = key.startsWith('--') ? key : hyphenate(key)

  if (importantIndex >= 0) {
    element.style.setProperty(property, value.slice(0, importantIndex).trim(), 'important')
    return
  }

  element.style.setProperty(property, value)
}

function removeStyleValue(element: HTMLElement, key: string) {
  const property = key.startsWith('--') ? key : hyphenate(key)
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

// Attribute updates that replace the style binding re-render the component, so
// re-apply after each update as well as watching nested style-object mutations.
onUpdated(applyDeclaredStyle)
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

let lastPayload: ResizeContainerResizeEvent | null = null

const { width, height, entry, start, stop, measure } = useResize(rootRef, {
  box: () => props.box,
  debounce: () => props.debounce,
  immediate: props.immediate,
  onResize: (measuredSize, record) => {
    if (!rootRef.value) return

    const payload = createPayload(record, measuredSize)
    lastPayload = payload
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
  () => props.immediate,
  (value) => {
    if (value) {
      nextTick(() => {
        measure()
      })
    }
  },
)

onMounted(() => {
  // Let the first client render keep the declared style (no FOUC flash), then
  // switch to imperative writes once that render has been patched. nextTick
  // runs after the DOM update but before the browser paints.
  hasMounted.value = true
  nextTick(applyDeclaredStyle)
})

onBeforeUnmount(() => {
  stop()
})

/**
 * Reads the current size synchronously and forces one `resize` event, even if
 * the size did not change since the last observation.
 */
function getSize(): ResizeContainerSize {
  lastPayload = null
  measure()
  return lastPayload ?? { width: size.width, height: size.height, entry: entry.value }
}

interface ResizeContainerExpose {
  width: Readonly<ShallowRef<number>>
  height: Readonly<ShallowRef<number>>
  entry: Readonly<ShallowRef<ResizeObserverEntry | null>>
  start: () => void
  stop: () => void
  getSize: () => ResizeContainerSize
}

defineExpose<ResizeContainerExpose>({
  width: shallowReadonly(width),
  height: shallowReadonly(height),
  entry: shallowReadonly(entry),
  start,
  stop,
  getSize,
})
</script>

<template>
  <div ref="rootRef" class="w-resize-container" v-bind="attrsForRender">
    <slot v-bind="slotProps" />
  </div>
</template>
