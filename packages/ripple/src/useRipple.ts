import { getCurrentScope, onScopeDispose } from 'vue'
import type { RippleOptions } from './types'

const DEFAULT_DURATION = 600
const FALLBACK_DELAY = 100

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false

  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function resolveDuration(duration?: number): number {
  const value = duration ?? DEFAULT_DURATION
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : DEFAULT_DURATION
}

function isKeyboardActivation(event: Event): boolean {
  return event.type === 'click' && (event as MouseEvent).detail === 0
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
  if (options.disabled) return null
  if (!element || typeof element.ownerDocument === 'undefined') return null

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

  const duration = prefersReducedMotion() ? 0 : resolveDuration(options.duration)
  wave.style.setProperty('--w-ripple-duration', `${duration}ms`)

  let fallback: ReturnType<typeof setTimeout> | undefined

  const remove = () => {
    if (fallback !== undefined) {
      clearTimeout(fallback)
      fallback = undefined
    }
    wave.removeEventListener('animationend', remove)
    wave.remove()
  }

  wave.addEventListener('animationend', remove)
  fallback = setTimeout(remove, duration + FALLBACK_DELAY)
  element.appendChild(wave)

  return wave
}

export interface UseRippleReturn {
  createRipple: typeof createRipple
}

export function useRipple(): UseRippleReturn {
  const waves = new Set<HTMLElement>()

  function ripple(element: HTMLElement, event?: Event, options: RippleOptions = {}) {
    const wave = createRipple(element, event, options)
    if (!wave) return null

    waves.add(wave)
    wave.addEventListener('animationend', () => waves.delete(wave), { once: true })
    return wave
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      for (const wave of waves) wave.remove()
      waves.clear()
    })
  }

  return { createRipple: ripple }
}
