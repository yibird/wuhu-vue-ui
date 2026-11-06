import { getCurrentScope, onScopeDispose } from 'vue'
import type { RippleOptions } from './types'

const DEFAULT_DURATION = 600
const FALLBACK_DELAY = 100

function resolveDuration(duration?: number): number {
  const value = duration ?? DEFAULT_DURATION
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : DEFAULT_DURATION
}

function isKeyboardActivation(event: Event): boolean {
  return event.type === 'click' && (event as MouseEvent).detail === 0
}

interface RippleHandle {
  wave: HTMLElement
  dispose: () => void
}

/**
 * Creates a ripple wave and returns a handle whose `dispose()` releases the
 * node, its listener and its fallback timer. `onDispose` runs for every path
 * (animation end, fallback timeout or manual disposal).
 */
function spawnRipple(
  element: HTMLElement,
  event: Event | undefined,
  options: RippleOptions,
  onDispose?: () => void,
): RippleHandle | null {
  if (options.disabled) return null
  if (!element || typeof element.ownerDocument === 'undefined') return null

  const duration = resolveDuration(options.duration)
  // A zero-duration wave has no visible animation; skip creating any DOM.
  if (duration <= 0) return null

  const doc = element.ownerDocument
  const rect = element.getBoundingClientRect()
  const width = Number.isFinite(rect.width) ? rect.width : 0
  const height = Number.isFinite(rect.height) ? rect.height : 0
  const centered = options.center === true || !event || isKeyboardActivation(event)

  let originX = width / 2
  let originY = height / 2

  if (!centered) {
    const pointer = event as MouseEvent
    originX = Number.isFinite(pointer.clientX) ? pointer.clientX - rect.left : width / 2
    originY = Number.isFinite(pointer.clientY) ? pointer.clientY - rect.top : height / 2
  }

  const radius = Math.hypot(Math.max(originX, width - originX), Math.max(originY, height - originY))

  const wave = doc.createElement('span')
  wave.className = 'w-ripple__wave'
  wave.setAttribute('aria-hidden', 'true')
  wave.style.width = `${radius * 2}px`
  wave.style.height = `${radius * 2}px`
  wave.style.left = `${originX - radius}px`
  wave.style.top = `${originY - radius}px`
  wave.style.setProperty('--w-ripple-color', options.color ?? 'currentColor')

  wave.style.setProperty('--w-ripple-duration', `${duration}ms`)

  let fallback: ReturnType<typeof setTimeout> | undefined
  let disposed = false

  const remove = () => {
    if (disposed) return
    disposed = true
    if (fallback !== undefined) {
      clearTimeout(fallback)
      fallback = undefined
    }
    wave.removeEventListener('animationend', remove)
    wave.remove()
    onDispose?.()
  }

  wave.addEventListener('animationend', remove)
  fallback = setTimeout(remove, duration + FALLBACK_DELAY)
  element.appendChild(wave)

  return { wave, dispose: remove }
}

/**
 * Creates a ripple wave inside `element` and removes it after the animation.
 *
 * Returns the created wave, or `null` when the ripple is disabled.
 */
export function createRipple(
  element: HTMLElement,
  event?: Event,
  options: RippleOptions = {},
): HTMLElement | null {
  return spawnRipple(element, event, options)?.wave ?? null
}

export interface UseRippleReturn {
  createRipple: typeof createRipple
}

export function useRipple(): UseRippleReturn {
  const disposers = new Set<() => void>()

  function ripple(element: HTMLElement, event?: Event, options: RippleOptions = {}) {
    let dispose: (() => void) | undefined
    const handle = spawnRipple(element, event, options, () => {
      if (dispose) disposers.delete(dispose)
    })
    if (!handle) return null

    dispose = handle.dispose
    disposers.add(dispose)
    return handle.wave
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      // `dispose` removes the node, listener and timer, then deletes itself
      // from the set through the callback.
      for (const dispose of Array.from(disposers)) dispose()
      disposers.clear()
    })
  }

  return { createRipple: ripple }
}
