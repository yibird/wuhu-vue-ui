import { autoUpdate, computePosition } from '@floating-ui/vue'
import type { Directive } from 'vue'
import { addDescribedBy, removeDescribedBy, resolveTheme } from './a11y'
import { createTooltipMiddleware } from './positioning'
import type { TooltipDirectiveValue, TooltipPlacement } from './types'

interface NormalizedOptions {
  content: string
  placement: TooltipPlacement
  offset: number
  showDelay: number
  hideDelay: number
}

interface DirectiveState {
  options: NormalizedOptions | null
  floating: HTMLDivElement | null
  stopAutoUpdate: (() => void) | undefined
  showTimer: ReturnType<typeof setTimeout> | undefined
  hideTimer: ReturnType<typeof setTimeout> | undefined
  originalTitle: string | null
  suppressed: boolean
  id: string
  listeners: [string, EventListener][]
}

const DEFAULT_SHOW_DELAY = 300
const DEFAULT_HIDE_DELAY = 0
const DEFAULT_OFFSET = 8

const states = new WeakMap<HTMLElement, DirectiveState>()
let activeElement: HTMLElement | null = null
let uid = 0

function normalize(value: TooltipDirectiveValue): NormalizedOptions | null {
  if (!value) return null

  const options =
    typeof value === 'string' ? { content: value } : { ...value, content: value.content ?? '' }

  const content = options.content.trim()
  if (!content) return null

  return {
    content: options.content,
    placement: options.placement ?? 'top',
    offset: options.offset ?? DEFAULT_OFFSET,
    showDelay: options.showDelay ?? DEFAULT_SHOW_DELAY,
    hideDelay: options.hideDelay ?? DEFAULT_HIDE_DELAY,
  }
}

function isDisabled(value: TooltipDirectiveValue): boolean {
  return typeof value === 'object' && value !== null && Boolean(value.disabled)
}

function updatePosition(el: HTMLElement, state: DirectiveState) {
  const floating = state.floating
  const options = state.options
  if (!floating || !options) return

  void computePosition(el, floating, {
    placement: options.placement,
    strategy: 'fixed',
    middleware: createTooltipMiddleware(() => options.offset),
  }).then(({ x, y, placement }) => {
    if (state.floating !== floating) return
    floating.style.left = `${x}px`
    floating.style.top = `${y}px`
    floating.dataset.placement = placement
  })
}

function hideNow(el: HTMLElement, state: DirectiveState) {
  if (state.showTimer !== undefined) {
    clearTimeout(state.showTimer)
    state.showTimer = undefined
  }
  if (state.hideTimer !== undefined) {
    clearTimeout(state.hideTimer)
    state.hideTimer = undefined
  }

  removeDescribedBy(el, state.id)

  state.stopAutoUpdate?.()
  state.stopAutoUpdate = undefined

  state.floating?.remove()
  state.floating = null

  if (activeElement === el) activeElement = null
}

function display(el: HTMLElement, state: DirectiveState) {
  const options = state.options
  if (!options) return

  if (activeElement && activeElement !== el) {
    const previous = states.get(activeElement)
    if (previous) hideNow(activeElement, previous)
  }

  if (!state.floating) {
    if (typeof document === 'undefined') return

    const floating = document.createElement('div')
    floating.id = state.id
    floating.className = 'w-tooltip'
    floating.setAttribute('role', 'tooltip')

    const theme = resolveTheme(el)
    if (theme) floating.setAttribute('data-w-theme', theme)

    document.body.appendChild(floating)
    state.floating = floating
  }

  const floating = state.floating
  if (!floating) return

  floating.textContent = options.content
  activeElement = el
  addDescribedBy(el, state.id)

  state.stopAutoUpdate?.()
  state.stopAutoUpdate = autoUpdate(el, floating, () => updatePosition(el, state))
}

function scheduleHide(el: HTMLElement, state: DirectiveState) {
  if (state.showTimer !== undefined) {
    clearTimeout(state.showTimer)
    state.showTimer = undefined
  }
  if (state.hideTimer !== undefined) {
    clearTimeout(state.hideTimer)
    state.hideTimer = undefined
  }

  const delay = state.options?.hideDelay ?? 0
  if (delay > 0) {
    state.hideTimer = setTimeout(() => {
      state.hideTimer = undefined
      hideNow(el, state)
    }, delay)
  } else {
    hideNow(el, state)
  }
}

function scheduleShow(el: HTMLElement, state: DirectiveState) {
  if (state.suppressed || !state.options) return

  if (state.hideTimer !== undefined) {
    clearTimeout(state.hideTimer)
    state.hideTimer = undefined
  }

  const delay = state.options.showDelay
  if (delay > 0) {
    state.showTimer = setTimeout(() => {
      state.showTimer = undefined
      display(el, state)
    }, delay)
  } else {
    display(el, state)
  }
}

function createState(el: HTMLElement, value: TooltipDirectiveValue): DirectiveState {
  const state: DirectiveState = {
    options: isDisabled(value) ? null : normalize(value),
    floating: null,
    stopAutoUpdate: undefined,
    showTimer: undefined,
    hideTimer: undefined,
    originalTitle: el.getAttribute('title'),
    suppressed: false,
    id: `w-tooltip-${++uid}`,
    listeners: [],
  }

  if (state.originalTitle !== null) el.removeAttribute('title')

  const listeners: [string, EventListener][] = [
    [
      'pointerenter',
      () => {
        state.suppressed = false
        scheduleShow(el, state)
      },
    ],
    [
      'pointerleave',
      () => {
        state.suppressed = false
        scheduleHide(el, state)
      },
    ],
    [
      'focusin',
      () => {
        state.suppressed = false
        scheduleShow(el, state)
      },
    ],
    [
      'focusout',
      () => {
        state.suppressed = false
        scheduleHide(el, state)
      },
    ],
    [
      'keydown',
      (event) => {
        if ((event as KeyboardEvent).key !== 'Escape' || !state.floating) return
        state.suppressed = true
        hideNow(el, state)
      },
    ],
  ]

  for (const [type, listener] of listeners) {
    el.addEventListener(type, listener)
  }
  state.listeners = listeners

  return state
}

export const vTooltip: Directive<HTMLElement, TooltipDirectiveValue> = {
  mounted(el, binding) {
    states.set(el, createState(el, binding.value))
  },
  updated(el, binding) {
    const state = states.get(el)
    if (!state) return

    state.options = isDisabled(binding.value) ? null : normalize(binding.value)

    if (state.originalTitle !== null) el.removeAttribute('title')

    if (!state.options) {
      hideNow(el, state)
      return
    }

    if (state.floating) {
      state.floating.textContent = state.options.content
      const theme = resolveTheme(el)
      if (theme) state.floating.setAttribute('data-w-theme', theme)
      else state.floating.removeAttribute('data-w-theme')
    }
  },
  beforeUnmount(el) {
    const state = states.get(el)
    if (!state) return

    for (const [type, listener] of state.listeners) {
      el.removeEventListener(type, listener)
    }
    state.listeners = []

    hideNow(el, state)

    if (state.originalTitle !== null) {
      el.setAttribute('title', state.originalTitle)
    }

    states.delete(el)
  },
}
