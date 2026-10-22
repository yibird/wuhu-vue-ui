import {
  computed,
  getCurrentScope,
  onScopeDispose,
  shallowRef,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type ShallowRef,
} from 'vue'

export interface UseResizeSize {
  width: number
  height: number
}

export interface UseResizeOptions {
  /** Observation box passed to ResizeObserver. Defaults to `content-box`. */
  box?: MaybeRefOrGetter<ResizeObserverBoxOptions | undefined>
  /** Debounce delay in milliseconds. Defaults to 0. */
  debounce?: MaybeRefOrGetter<number | undefined>
  /** Pause observation. */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** Measure once when observation starts. Defaults to true. */
  immediate?: MaybeRefOrGetter<boolean | undefined>
  /** Called whenever the measured size changes. */
  onResize?: (size: UseResizeSize, entry: ResizeObserverEntry | null) => void
}

export interface UseResizeReturn {
  /** Bind this ref to the element you want to observe when no source is passed. */
  target: ShallowRef<Element | null>
  /** Observed width in CSS pixels. */
  width: ShallowRef<number>
  /** Observed height in CSS pixels. */
  height: ShallowRef<number>
  /** Latest ResizeObserverEntry, or `null` before the first observation. */
  entry: ShallowRef<ResizeObserverEntry | null>
  /** Whether the current environment supports ResizeObserver. */
  isSupported: ComputedRef<boolean>
  /** (Re)start observing the target. */
  start: () => void
  /** Stop observing and disconnect the observer. */
  stop: () => void
  /** Measure immediately and notify listeners even if the size is unchanged. */
  measure: () => void
}

function readEntrySize(entry: ResizeObserverEntry, box: ResizeObserverBoxOptions): UseResizeSize {
  if (box === 'border-box') {
    const size = entry.borderBoxSize
    const first = Array.isArray(size) ? size[0] : size
    if (first) return { width: first.inlineSize, height: first.blockSize }
  }

  if (box === 'device-pixel-content-box') {
    const size = entry.devicePixelContentBoxSize
    const first = Array.isArray(size) ? size[0] : size
    if (first) return { width: first.inlineSize, height: first.blockSize }

    // Box type unsupported: keep the same unit as readElementSize(). Otherwise
    // the fallback path would report CSS pixels while the direct path reports
    // device pixels.
    const ratio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
    return {
      width: entry.contentRect.width * ratio,
      height: entry.contentRect.height * ratio,
    }
  }

  return { width: entry.contentRect.width, height: entry.contentRect.height }
}

function readElementSize(element: Element, box: ResizeObserverBoxOptions): UseResizeSize {
  if (typeof element.getBoundingClientRect !== 'function') return { width: 0, height: 0 }

  const rect = element.getBoundingClientRect()
  if (box === 'border-box') return { width: rect.width, height: rect.height }

  if (typeof getComputedStyle !== 'function') return { width: rect.width, height: rect.height }

  const style = getComputedStyle(element)
  const horizontalInset =
    Number.parseFloat(style.paddingLeft || '0') +
    Number.parseFloat(style.paddingRight || '0') +
    Number.parseFloat(style.borderLeftWidth || '0') +
    Number.parseFloat(style.borderRightWidth || '0')
  const verticalInset =
    Number.parseFloat(style.paddingTop || '0') +
    Number.parseFloat(style.paddingBottom || '0') +
    Number.parseFloat(style.borderTopWidth || '0') +
    Number.parseFloat(style.borderBottomWidth || '0')

  let width = Math.max(0, rect.width - horizontalInset)
  let height = Math.max(0, rect.height - verticalInset)

  if (box === 'device-pixel-content-box') {
    const ratio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
    width *= ratio
    height *= ratio
  }

  return { width, height }
}

/**
 * Reactively tracks the size of an element using ResizeObserver, falling back
 * to window resize events when ResizeObserver is unavailable.
 *
 * The returned `target` ref can be bound directly in a template, or you can
 * pass an existing element ref/getter as the first argument.
 */
export function useResize(
  source?: MaybeRefOrGetter<Element | null | undefined>,
  options: UseResizeOptions = {},
): UseResizeReturn {
  const target = shallowRef<Element | null>(null)
  const width = shallowRef(0)
  const height = shallowRef(0)
  const entry = shallowRef<ResizeObserverEntry | null>(null)

  const isSupported = computed(() => typeof ResizeObserver !== 'undefined')

  let observer: ResizeObserver | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let windowListening = false
  let lastKey = ''

  if (source !== undefined) {
    watch(
      () => toValue(source) ?? null,
      (element) => {
        target.value = element
      },
      { immediate: true, flush: 'sync' },
    )
  }

  function observe(targetElement: Element) {
    if (typeof ResizeObserver === 'undefined') {
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleWindowResize)
        windowListening = true
      }
      return
    }

    observer = new ResizeObserver(handleEntries)
    try {
      observer.observe(targetElement, { box: toValue(options.box) ?? 'content-box' })
    } catch {
      observer.observe(targetElement)
    }
  }

  function applySize(size: UseResizeSize, record: ResizeObserverEntry | null) {
    if (record) entry.value = record
    width.value = size.width
    height.value = size.height

    const key = `${size.width}:${size.height}`
    if (key === lastKey) return
    lastKey = key
    options.onResize?.({ ...size }, record)
  }

  function update(record: ResizeObserverEntry | null) {
    const element = target.value
    if (!element) return

    const box = toValue(options.box) ?? 'content-box'
    const size = record ? readEntrySize(record, box) : readElementSize(element, box)
    applySize(size, record)
  }

  function schedule(record: ResizeObserverEntry | null, force = false) {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }

    if (force) {
      lastKey = ''
      update(record)
      return
    }

    const wait = toValue(options.debounce) ?? 0
    if (wait <= 0) {
      update(record)
      return
    }

    timer = setTimeout(() => {
      timer = undefined
      update(record)
    }, wait)
  }

  function handleEntries(entries: ResizeObserverEntry[]) {
    schedule(entries[entries.length - 1] ?? null)
  }

  function handleWindowResize() {
    schedule(null)
  }

  function stop() {
    observer?.disconnect()
    observer = undefined

    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }

    if (windowListening) {
      window.removeEventListener('resize', handleWindowResize)
      windowListening = false
    }
  }

  function start() {
    stop()
    lastKey = ''

    const element = target.value
    if (!element || toValue(options.disabled)) return

    observe(element)
    if (toValue(options.immediate) ?? true) update(null)
  }

  function measure() {
    if (!target.value) return
    schedule(null, true)
  }

  watch([target, () => toValue(options.box), () => toValue(options.disabled)], () => start(), {
    immediate: true,
    flush: 'sync',
  })

  if (getCurrentScope()) {
    onScopeDispose(stop)
  }

  return {
    target,
    width,
    height,
    entry,
    isSupported,
    start,
    stop,
    measure,
  }
}
