import type { Directive } from 'vue'
import type { RippleOptions } from './types'
import { createRipple } from './useRipple'

export type RippleDirectiveValue = boolean | RippleOptions | undefined

interface DirectiveState {
  options: RippleOptions
  originalPosition: string
  originalOverflow: string
  hadClass: boolean
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
    const state: DirectiveState = {
      options,
      originalPosition: element.style.position,
      originalOverflow: element.style.overflow,
      hadClass: element.classList.contains('w-ripple'),
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
    element.style.position = 'relative'
    element.style.overflow = 'hidden'
    element.classList.add('w-ripple')
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
    element.style.position = state.originalPosition
    element.style.overflow = state.originalOverflow
    if (!state.hadClass) element.classList.remove('w-ripple')

    states.delete(element)
  },
}
