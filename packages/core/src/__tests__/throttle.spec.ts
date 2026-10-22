import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { throttle } from '../utils/throttle'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('throttle', () => {
  it('invokes immediately and queues the latest trailing call', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled('a')
    expect(fn).toHaveBeenCalledWith('a')

    vi.advanceTimersByTime(50)
    throttled('b')
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('b')
  })

  it('invokes immediately again once the wait has elapsed', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled('a')
    vi.advanceTimersByTime(100)
    throttled('b')

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('b')
  })

  it('supports trailing-only invocation', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100, { leading: false })

    throttled('a')
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledWith('a')

    vi.advanceTimersByTime(100)
    throttled('b')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenLastCalledWith('b')
  })

  it('can invoke on the leading edge only', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100, { trailing: false })

    throttled('a')
    throttled('b')
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('cancel prevents the pending trailing invocation', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled('a')
    vi.advanceTimersByTime(50)
    throttled('b')
    expect(throttled.pending()).toBe(true)

    throttled.cancel()
    expect(throttled.pending()).toBe(false)
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('flush invokes the pending call immediately', () => {
    const fn = vi.fn((value: string) => value)
    const throttled = throttle(fn, 100)

    throttled('a')
    vi.advanceTimersByTime(50)
    throttled('b')

    expect(throttled.flush()).toBe('b')
    expect(fn).toHaveBeenCalledTimes(2)
    expect(throttled.pending()).toBe(false)
  })

  it('invokes a trailing-only call that lands on the wait boundary', () => {
    vi.setSystemTime(0)
    const fn = vi.fn()
    const throttled = throttle(fn, 100, { leading: false })

    throttled('a')
    expect(fn).not.toHaveBeenCalled()

    // Reach the boundary without letting the scheduled trailing timer run.
    vi.setSystemTime(100)
    throttled('b')

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('b')

    // The stale timer must not fire with the previous arguments.
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
