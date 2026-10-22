import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { debounce, type DebouncedFunction } from '../utils/debounce'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('debounce', () => {
  it('invokes once with the latest arguments after the wait', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('a')
    debounced('b')
    debounced('c')

    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })

  it('restarts the wait on every call', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    vi.advanceTimersByTime(90)
    debounced()
    vi.advanceTimersByTime(90)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(10)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('supports leading invocation', () => {
    const fn = vi.fn((value: string) => value.toUpperCase())
    const debounced = debounce(fn, 100, { leading: true })

    expect(debounced('a')).toBe('A')
    expect(fn).toHaveBeenCalledWith('a')

    debounced('b')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('b')
  })

  it('can invoke on the leading edge only', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100, { leading: true, trailing: false })

    debounced('a')
    debounced('b')
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('cancel prevents the pending invocation', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('a')
    vi.advanceTimersByTime(50)
    expect(debounced.pending()).toBe(true)

    debounced.cancel()
    expect(debounced.pending()).toBe(false)
    vi.advanceTimersByTime(100)
    expect(fn).not.toHaveBeenCalled()
  })

  it('flush invokes the pending call immediately', () => {
    const fn = vi.fn((value: string) => value)
    const debounced = debounce(fn, 100)

    debounced('a')
    expect(debounced.flush()).toBe('a')
    expect(fn).toHaveBeenCalledWith('a')
    expect(debounced.pending()).toBe(false)

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('returns the previous result while a call is pending', () => {
    const fn = vi.fn((value: number) => value * 2)
    const debounced = debounce(fn, 100)

    expect(debounced(2)).toBeUndefined()
    vi.advanceTimersByTime(100)
    expect(debounced(3)).toBe(4)
  })

  it('keeps the state consistent when the leading callback re-enters', () => {
    const calls: string[] = []
    let debounced: DebouncedFunction<(value: string) => void>
    const fn = vi.fn((value: string) => {
      calls.push(value)
      if (value === 'outer') debounced('inner')
    })
    debounced = debounce(fn, 100, { leading: true, trailing: true })

    debounced('outer')

    expect(calls).toEqual(['outer'])
    expect(debounced.pending()).toBe(true)

    vi.advanceTimersByTime(100)
    expect(calls).toEqual(['outer', 'inner'])
  })

  it('lets the leading callback cancel the window timer', () => {
    let debounced: DebouncedFunction<() => void>
    const fn = vi.fn(() => debounced.cancel())
    debounced = debounce(fn, 100, { leading: true, trailing: true })

    debounced()

    expect(fn).toHaveBeenCalledTimes(1)
    expect(debounced.pending()).toBe(false)
    expect(vi.getTimerCount()).toBe(0)

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)

    debounced()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('does not invoke leading again after flush within the original wait', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100, { leading: true })

    debounced('a')
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(50)
    debounced.flush()
    expect(fn).toHaveBeenCalledTimes(1)

    debounced('b')
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('b')
  })

  it('does not report a pending call for leading-only debounce', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100, { leading: true, trailing: false })

    debounced('a')
    expect(debounced.pending()).toBe(false)

    debounced('b')
    expect(debounced.pending()).toBe(false)

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
