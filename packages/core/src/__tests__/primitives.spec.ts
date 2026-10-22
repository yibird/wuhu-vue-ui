import { effectScope, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { useControllableState } from '../hooks/useControllableState'
import { useDismissable } from '../hooks/useDismissable'
import { useListNavigation } from '../hooks/useListNavigation'
import { useMediaQuery, usePrefersReducedMotion } from '../hooks/useMediaQuery'
import { useRaf } from '../hooks/useRaf'
import { useIntervalFn, useTimeoutFn } from '../hooks/useTimer'
import { clamp } from '../utils/math'
import { toCssSize, toCssUnit } from '../utils/style'
import { clampToViewport } from '../utils/viewport'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('math / style / viewport utilities', () => {
  it('clamps into the inclusive range', () => {
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('converts numeric sizes and passes strings through', () => {
    expect(toCssUnit(12)).toBe('12px')
    expect(toCssUnit('2rem')).toBe('2rem')
    expect(toCssUnit(undefined)).toBeUndefined()
    expect(toCssUnit('')).toBeUndefined()
    expect(toCssSize).toBe(toCssUnit)
  })

  it('keeps floating elements inside the viewport', () => {
    expect(
      clampToViewport(
        -20,
        -10,
        { width: 100, height: 50 },
        {
          margin: 8,
          viewport: { width: 300, height: 200 },
        },
      ),
    ).toEqual({ x: 8, y: 8 })

    expect(
      clampToViewport(
        500,
        400,
        { width: 100, height: 50 },
        {
          margin: 8,
          viewport: { width: 300, height: 200 },
        },
      ),
    ).toEqual({ x: 192, y: 142 })
  })
})

describe('useControllableState', () => {
  it('updates internal state and emits in uncontrolled mode', () => {
    const onChange = vi.fn()
    const state = useControllableState({ defaultValue: 10, onChange })

    expect(state.isControlled.value).toBe(false)
    expect(state.value.value).toBe(10)

    state.setValue(20)
    expect(state.value.value).toBe(20)
    expect(onChange).toHaveBeenLastCalledWith(20)
  })

  it('follows the prop and only emits in controlled mode', () => {
    const source = ref<number | undefined>(10)
    const onChange = vi.fn()
    const state = useControllableState({ value: source, defaultValue: 0, onChange })

    state.setValue(30)
    expect(state.value.value).toBe(10)
    expect(onChange).toHaveBeenLastCalledWith(30)

    source.value = 40
    expect(state.value.value).toBe(40)
  })

  it('normalizes before comparing and emitting', () => {
    const onChange = vi.fn()
    const state = useControllableState({
      defaultValue: 0,
      normalize: (value) => clamp(value, 0, 100),
      onChange,
    })

    state.setValue(150)
    expect(state.value.value).toBe(100)
    expect(onChange).toHaveBeenLastCalledWith(100)
  })
})

describe('useListNavigation', () => {
  function keyEvent(key: string, composing = false): KeyboardEvent {
    return { key, isComposing: composing, preventDefault: vi.fn() } as unknown as KeyboardEvent
  }

  it('moves linearly, wraps, and activates the current item', () => {
    const items = ['a', 'b', 'c']
    const active = ref<number | null>(null)
    const activated = vi.fn()
    const nav = useListNavigation({
      items,
      activeIndex: active,
      onHighlight: (index) => (active.value = index),
      onActivate: (item) => activated(item),
    })

    expect(nav.handleKeydown(keyEvent('ArrowDown'))).toBe(true)
    expect(active.value).toBe(0)
    nav.handleKeydown(keyEvent('ArrowUp'))
    expect(active.value).toBe(2)
    nav.handleKeydown(keyEvent('Enter'))
    expect(activated).toHaveBeenLastCalledWith('c')
  })

  it('supports grid movement and clamping when loop is disabled', () => {
    const items = ['0', '1', '2', '3', '4', '5']
    const active = ref(0)
    const nav = useListNavigation({
      items,
      columns: 3,
      loop: false,
      activeIndex: active,
      onHighlight: (index) => (active.value = index),
    })

    nav.handleKeydown(keyEvent('ArrowDown'))
    expect(active.value).toBe(3)
    nav.handleKeydown(keyEvent('ArrowRight'))
    expect(active.value).toBe(4)
    nav.handleKeydown(keyEvent('ArrowDown'))
    expect(active.value).toBe(5)
  })

  it('ignores keys while composing', () => {
    const nav = useListNavigation({
      items: ['a'],
      activeIndex: 0,
      onHighlight: vi.fn(),
    })
    expect(nav.handleKeydown(keyEvent('ArrowDown', true))).toBe(false)
  })
})

describe('useDismissable', () => {
  it('dismisses on outside pointerdown and Escape, but not inside', () => {
    const outside = document.createElement('div')
    const inside = document.createElement('div')
    inside.appendChild(document.createElement('span'))
    document.body.append(outside, inside)

    const onDismiss = vi.fn()
    const dismiss = useDismissable({ ignore: inside, onDismiss })

    dismiss.start()
    inside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(onDismiss).not.toHaveBeenCalled()

    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(onDismiss).toHaveBeenLastCalledWith('pointer', expect.any(Event))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onDismiss).toHaveBeenLastCalledWith('escape', expect.any(Event))

    dismiss.stop()
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(onDismiss).toHaveBeenCalledTimes(2)

    outside.remove()
    inside.remove()
  })

  it('stops automatically when the owning scope is disposed', () => {
    const onDismiss = vi.fn()
    const scope = effectScope()
    scope.run(() => useDismissable({ onDismiss }).start())
    scope.stop()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onDismiss).not.toHaveBeenCalled()
  })
})

describe('useMediaQuery', () => {
  it('tracks matches, query changes, and listener cleanup', async () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>()
    const mediaQuery = {
      matches: true,
      addEventListener: vi.fn((_: string, handler: (event: MediaQueryListEvent) => void) => {
        listeners.add(handler)
      }),
      removeEventListener: vi.fn((_: string, handler: (event: MediaQueryListEvent) => void) => {
        listeners.delete(handler)
      }),
    }
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mediaQuery),
    )

    const query = ref('(min-width: 600px)')
    const scope = effectScope()
    const matches = scope.run(() => useMediaQuery(query))!
    expect(matches.value).toBe(true)

    for (const listener of listeners) {
      listener({ matches: false } as MediaQueryListEvent)
    }
    expect(matches.value).toBe(false)

    scope.stop()
    expect(mediaQuery.removeEventListener).toHaveBeenCalled()
    expect(usePrefersReducedMotion).toBeTypeOf('function')
  })
})

describe('useRaf', () => {
  it('schedules once, cancels, and cleans up with the scope', () => {
    let callback: FrameRequestCallback | undefined
    const request = vi.fn((cb: FrameRequestCallback) => {
      callback = cb
      return 1
    })
    const cancel = vi.fn()
    vi.stubGlobal('requestAnimationFrame', request)
    vi.stubGlobal('cancelAnimationFrame', cancel)

    const scope = effectScope()
    const raf = scope.run(() => useRaf(vi.fn()))!
    raf.schedule()
    raf.schedule()
    expect(request).toHaveBeenCalledTimes(1)
    expect(raf.isPending()).toBe(true)

    callback?.(16)
    expect(raf.isPending()).toBe(false)

    raf.schedule()
    scope.stop()
    expect(cancel).toHaveBeenCalled()
  })
})

describe('useIntervalFn / useTimeoutFn', () => {
  beforeEach(() => vi.useFakeTimers())

  it('runs an interval immediately when requested and stops cleanly', () => {
    const callback = vi.fn()
    const scope = effectScope()
    const interval = scope.run(() => useIntervalFn(callback, 100, { immediate: true }))!
    interval.start()

    expect(callback).toHaveBeenCalledTimes(1)
    expect(interval.isActive.value).toBe(true)

    vi.advanceTimersByTime(250)
    expect(callback).toHaveBeenCalledTimes(3)

    interval.stop()
    vi.advanceTimersByTime(200)
    expect(callback).toHaveBeenCalledTimes(3)
  })

  it('runs a timeout once and reports pending state', () => {
    const callback = vi.fn()
    const scope = effectScope()
    const timeout = scope.run(() => useTimeoutFn(callback, 50))!

    timeout.start()
    expect(timeout.isPending.value).toBe(true)
    vi.advanceTimersByTime(50)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(timeout.isPending.value).toBe(false)

    scope.stop()
  })
})
