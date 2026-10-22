import { effectScope, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { useResize } from '../hooks/useResize'

class ResizeObserverMock implements ResizeObserver {
  static instances: ResizeObserverMock[] = []

  readonly callback: ResizeObserverCallback
  readonly observed: Element[] = []
  disconnected = false

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    ResizeObserverMock.instances.push(this)
  }

  observe(target: Element) {
    this.observed.push(target)
  }

  unobserve() {}

  disconnect() {
    this.disconnected = true
  }

  trigger(entries: unknown[]) {
    this.callback(entries as ResizeObserverEntry[], this)
  }
}

function createElement(width: number, height: number) {
  const element = document.createElement('div')
  element.getBoundingClientRect = () =>
    ({ width, height, top: 0, left: 0, right: width, bottom: height }) as DOMRect
  return element
}

beforeEach(() => {
  ResizeObserverMock.instances = []
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useResize', () => {
  it('measures the source element and observes it', () => {
    const element = createElement(120, 80)
    const scope = effectScope()
    const { width, height } = scope.run(() => useResize(element))!

    expect(width.value).toBe(120)
    expect(height.value).toBe(80)
    expect(ResizeObserverMock.instances[0]?.observed).toContain(element)

    scope.stop()
  })

  it('updates width and height from ResizeObserver entries', () => {
    const element = createElement(120, 80)
    const onResize = vi.fn()
    const scope = effectScope()
    const { width, height, entry } = scope.run(() => useResize(element, { onResize }))!

    const record = {
      contentRect: { width: 200, height: 90 },
    } as ResizeObserverEntry

    ResizeObserverMock.instances[0]!.trigger([record])

    expect(width.value).toBe(200)
    expect(height.value).toBe(90)
    expect(entry.value).toBe(record)
    expect(onResize).toHaveBeenLastCalledWith({ width: 200, height: 90 }, record)

    scope.stop()
  })

  it('only notifies when the size changes', () => {
    const element = createElement(120, 80)
    const onResize = vi.fn()
    const scope = effectScope()
    scope.run(() => useResize(element, { onResize }))!

    expect(onResize).toHaveBeenCalledOnce()

    const observer = ResizeObserverMock.instances[0]!
    observer.trigger([{ contentRect: { width: 120, height: 80 } } as ResizeObserverEntry])
    expect(onResize).toHaveBeenCalledOnce()

    observer.trigger([{ contentRect: { width: 121, height: 80 } } as ResizeObserverEntry])
    expect(onResize).toHaveBeenCalledTimes(2)

    scope.stop()
  })

  it('stops observing when disabled and disconnects on scope disposal', async () => {
    const element = createElement(120, 80)
    const disabled = ref(false)
    const scope = effectScope()
    const hook = scope.run(() => useResize(element, { disabled }))!

    const observer = ResizeObserverMock.instances[0]!

    disabled.value = true
    await nextTick()
    expect(observer.disconnected).toBe(true)

    disabled.value = false
    await nextTick()
    expect(ResizeObserverMock.instances).toHaveLength(2)
    expect(hook.width.value).toBe(120)

    scope.stop()
    expect(ResizeObserverMock.instances[1]?.disconnected).toBe(true)
  })

  it('tracks an element bound to the returned target ref', async () => {
    const element = createElement(64, 32)
    const scope = effectScope()
    const { target, width, height } = scope.run(() => useResize())!

    target.value = element
    await nextTick()

    expect(width.value).toBe(64)
    expect(height.value).toBe(32)
    expect(ResizeObserverMock.instances[0]?.observed).toContain(element)

    scope.stop()
  })

  it('debounces ResizeObserver updates', () => {
    vi.useFakeTimers()
    const element = createElement(120, 80)
    const onResize = vi.fn()
    const scope = effectScope()
    const { width } = scope.run(() => useResize(element, { debounce: 100, onResize }))!

    const observer = ResizeObserverMock.instances[0]!
    observer.trigger([{ contentRect: { width: 200, height: 90 } } as ResizeObserverEntry])
    observer.trigger([{ contentRect: { width: 300, height: 90 } } as ResizeObserverEntry])

    expect(width.value).toBe(120)

    vi.advanceTimersByTime(100)
    expect(width.value).toBe(300)
    expect(onResize).toHaveBeenLastCalledWith({ width: 300, height: 90 }, expect.anything())

    scope.stop()
    vi.useRealTimers()
  })

  it('falls back to window resize events without ResizeObserver', async () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const element = createElement(100, 50)
    const scope = effectScope()
    const { width, isSupported } = scope.run(() => useResize(element))!

    expect(isSupported.value).toBe(false)
    expect(width.value).toBe(100)

    element.getBoundingClientRect = () =>
      ({ width: 150, height: 60, top: 0, left: 0, right: 150, bottom: 60 }) as DOMRect
    window.dispatchEvent(new Event('resize'))

    expect(width.value).toBe(150)

    scope.stop()
  })
})
