import type { Directive } from 'vue'
import type { RippleOptions } from './types'
import { createRipple } from './useRipple'

export type RippleDirectiveValue = boolean | RippleOptions | undefined

interface DirectiveState {
  options: RippleOptions
  originalPosition: string
  positionApplied: boolean
  hadHostClass: boolean
  onPointerDown: (event: Event) => void
  onClick: (event: Event) => void
}

const states = new WeakMap<HTMLElement, DirectiveState>()

function normalizeOptions(value: RippleDirectiveValue): RippleOptions {
  if (value === false) return { disabled: true }
  if (value === true || value === undefined) return {}
  return { ...value }
}

function removeWaves(element: HTMLElement) {
  element.querySelectorAll('.w-ripple__wave').forEach((node) => node.remove())
}

export const vRipple: Directive<HTMLElement, RippleDirectiveValue> = {
  mounted(element, binding) {
    const options = normalizeOptions(binding.value)
    const computedPosition =
      typeof window === 'undefined' ? 'static' : window.getComputedStyle(element).position
    // Only add positioning when the host is statically positioned. Existing
    // relative/absolute/fixed/sticky positioning is left untouched.
    const positionApplied = !computedPosition || computedPosition === 'static'

    const state: DirectiveState = {
      options,
      originalPosition: element.style.position,
      positionApplied,
      hadHostClass: element.classList.contains('w-ripple-host'),
      onPointerDown(event) {
        if (state.options.disabled || state.options.trigger === 'click') return
        createRipple(element, event, state.options)
      },
      onClick(event) {
        if (state.options.disabled) return

        const keyboard = event instanceof MouseEvent && event.detail === 0
        if (state.options.trigger === 'click' || keyboard) {
          createRipple(element, event, state.options)
        }
      },
    }

    states.set(element, state)
    if (positionApplied) element.style.position = 'relative'
    // The host-only class provides the clipping context without forcing a
    // display model (inline-flex) on the consumer's element.
    element.classList.add('w-ripple-host')
    element.addEventListener('pointerdown', state.onPointerDown)
    element.addEventListener('click', state.onClick)
  },

  updated(element, binding) {
    const state = states.get(element)
    if (!state) return
    state.options = normalizeOptions(binding.value)
  },

  unmounted(element) {
    const state = states.get(element)
    if (!state) return

    element.removeEventListener('pointerdown', state.onPointerDown)
    element.removeEventListener('click', state.onClick)
    removeWaves(element)
    if (state.positionApplied) element.style.position = state.originalPosition
    if (!state.hadHostClass) element.classList.remove('w-ripple-host')

    states.delete(element)
  },
}
