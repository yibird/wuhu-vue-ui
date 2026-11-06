import { getCurrentScope, onScopeDispose, toValue, watch, type MaybeRefOrGetter } from 'vue'

export type DismissReason = 'pointer' | 'escape' | 'resize' | 'scroll'

export interface UseDismissableOptions {
  /** Called when an outside interaction should close the layer. */
  onDismiss: (reason: DismissReason, event?: Event) => void
  /** Element(s) that should not count as outside clicks or scrolls. */
  ignore?: MaybeRefOrGetter<Element | Element[] | null | undefined>
  /** Listen for pointerdown outside the ignored elements. Defaults to true. */
  pointer?: boolean
  /** Listen for Escape. Defaults to true. */
  escape?: boolean
  /** Close on window resize. Defaults to false. */
  resize?: boolean
  /** Close on scroll outside the ignored elements. Defaults to false. */
  scroll?: boolean
  /** Capture pointerdown/keydown/scroll. Defaults to true. */
  capture?: boolean
  /**
   * When provided, the hook starts/stops automatically as the value changes.
   * Otherwise call `start()`/`stop()` manually.
   */
  enabled?: MaybeRefOrGetter<boolean>
}

export interface UseDismissableReturn {
  start: () => void
  stop: () => void
  isActive: () => boolean
}

function ignoredElements(value: Element | Element[] | null | undefined): Element[] {
  if (!value) return []
  return Array.isArray(value) ? value.filter(Boolean) : [value]
}

/**
 * Shared outside-click / Escape / resize / scroll dismissal for menus and
 * floating layers. Cleans up every listener when stopped or unmounted.
 */
export function useDismissable(options: UseDismissableOptions): UseDismissableReturn {
  let active = false

  const isIgnored = (target: EventTarget | null): boolean => {
    if (!(target instanceof Node)) return false
    return ignoredElements(toValue(options.ignore)).some((element) => element.contains(target))
  }

  const handlePointer = (event: PointerEvent) => {
    if (isIgnored(event.target)) return
    options.onDismiss('pointer', event)
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    options.onDismiss('escape', event)
  }

  const handleResize = (event: Event) => {
    options.onDismiss('resize', event)
  }

  const handleScroll = (event: Event) => {
    if (isIgnored(event.target)) return
    options.onDismiss('scroll', event)
  }

  function start() {
    if (active || typeof window === 'undefined') return
    active = true
    const capture = options.capture ?? true

    if (options.pointer ?? true) {
      window.addEventListener('pointerdown', handlePointer, capture)
    }
    if (options.escape ?? true) {
      window.addEventListener('keydown', handleKeydown, capture)
    }
    if (options.resize ?? false) {
      window.addEventListener('resize', handleResize)
    }
    if (options.scroll ?? false) {
      window.addEventListener('scroll', handleScroll, capture)
    }
  }

  function stop() {
    if (!active || typeof window === 'undefined') return
    active = false
    const capture = options.capture ?? true

    window.removeEventListener('pointerdown', handlePointer, capture)
    window.removeEventListener('keydown', handleKeydown, capture)
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('scroll', handleScroll, capture)
  }

  if (options.enabled !== undefined) {
    watch(
      () => toValue(options.enabled),
      (enabled) => (enabled ? start() : stop()),
      { immediate: true },
    )
  }

  if (getCurrentScope()) onScopeDispose(stop)

  return { start, stop, isActive: () => active }
}
