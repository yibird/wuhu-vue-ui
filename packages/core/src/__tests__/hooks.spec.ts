import { effectScope, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { useCopy, useDebounce, useDebounceFn, useThrottle, useThrottleFn } from '../../index'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  Reflect.deleteProperty(navigator, 'clipboard')
  Reflect.deleteProperty(window, 'isSecureContext')
  Reflect.deleteProperty(document, 'execCommand')
})

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function mockClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true })
}

describe('useDebounce', () => {
  it('mirrors the source after the wait', () => {
    const source = ref('a')
    const scope = effectScope()
    const value = scope.run(() => useDebounce(source, 100))!

    source.value = 'b'
    expect(value.value).toBe('a')

    vi.advanceTimersByTime(100)
    expect(value.value).toBe('b')

    scope.stop()
  })

  it('cancels a pending call when the scope stops', () => {
    const fn = vi.fn()
    const scope = effectScope()
    const debounced = scope.run(() => useDebounceFn(fn, 100))!

    debounced()
    scope.stop()
    vi.advanceTimersByTime(100)

    expect(fn).not.toHaveBeenCalled()
  })
})

describe('useThrottle', () => {
  it('mirrors the source at most once per wait', () => {
    const source = ref(0)
    const scope = effectScope()
    const value = scope.run(() => useThrottle(source, 100))!

    source.value = 1
    expect(value.value).toBe(1)

    source.value = 2
    expect(value.value).toBe(1)

    vi.advanceTimersByTime(100)
    expect(value.value).toBe(2)

    scope.stop()
  })

  it('cancels a pending call when the scope stops', () => {
    const fn = vi.fn()
    const scope = effectScope()
    const throttled = scope.run(() => useThrottleFn(fn, 100, { leading: false }))!

    throttled()
    scope.stop()
    vi.advanceTimersByTime(100)

    expect(fn).not.toHaveBeenCalled()
  })
})

describe('useCopy', () => {
  it('tracks copied state and resets it after the duration', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true })

    const onSuccess = vi.fn()
    const scope = effectScope()
    const { copied, error, loading, copy } = scope.run(() => useCopy({ duration: 50, onSuccess }))!

    const promise = copy('hello')
    expect(loading.value).toBe(true)
    await expect(promise).resolves.toBe(true)

    expect(copied.value).toBe(true)
    expect(error.value).toBeNull()
    expect(onSuccess).toHaveBeenCalledWith('hello')

    vi.advanceTimersByTime(50)
    expect(copied.value).toBe(false)

    scope.stop()
  })

  it('captures copy failures', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true })

    const execCommand = vi.fn(() => false)
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    })

    const onError = vi.fn()
    const scope = effectScope()
    const { copied, error, copy } = scope.run(() => useCopy({ onError }))!

    await expect(copy('hello')).resolves.toBe(false)
    expect(copied.value).toBe(false)
    expect(error.value?.message).toContain('rejected')
    expect(onError).toHaveBeenCalledOnce()

    scope.stop()
  })

  it('discards an in-flight copy superseded by reset()', async () => {
    const first = deferred()
    const second = deferred()
    const writeText = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    mockClipboard(writeText)

    const onSuccess = vi.fn()
    const scope = effectScope()
    const { copied, loading, copy, reset } = scope.run(() => useCopy({ duration: 50, onSuccess }))!

    const firstCopy = copy('one')
    expect(loading.value).toBe(true)

    reset()
    expect(loading.value).toBe(false)
    expect(copied.value).toBe(false)

    const secondCopy = copy('two')
    expect(loading.value).toBe(true)

    first.resolve()
    await expect(firstCopy).resolves.toBe(false)
    expect(onSuccess).not.toHaveBeenCalled()
    expect(copied.value).toBe(false)
    expect(loading.value).toBe(true)

    second.resolve()
    await expect(secondCopy).resolves.toBe(true)

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('two')
    expect(copied.value).toBe(true)

    vi.advanceTimersByTime(50)
    expect(copied.value).toBe(false)

    scope.stop()
  })

  it('does not treat onSuccess callback errors as copy failures', async () => {
    mockClipboard(vi.fn().mockResolvedValue(undefined))

    const onSuccess = vi.fn(() => {
      throw new Error('callback failed')
    })
    const onError = vi.fn()
    const scope = effectScope()
    const { copied, error, copy } = scope.run(() => useCopy({ onSuccess, onError }))!

    await expect(copy('hello')).resolves.toBe(true)

    expect(copied.value).toBe(true)
    expect(error.value).toBeNull()
    expect(onSuccess).toHaveBeenCalledWith('hello')
    expect(onError).not.toHaveBeenCalled()

    scope.stop()
  })

  it('does not reject when the onError callback throws', async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error('denied')))
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn(() => false),
    })

    const onError = vi.fn(() => {
      throw new Error('callback failed')
    })
    const scope = effectScope()
    const { copied, error, copy } = scope.run(() => useCopy({ onError }))!

    await expect(copy('hello')).resolves.toBe(false)

    expect(copied.value).toBe(false)
    expect(error.value?.message).toContain('rejected')
    expect(onError).toHaveBeenCalledOnce()

    scope.stop()
  })

  it('resets loading when disposed during an in-flight copy', async () => {
    const pending = deferred()
    mockClipboard(vi.fn().mockReturnValueOnce(pending.promise))

    const scope = effectScope()
    const { copied, loading, copy } = scope.run(() => useCopy())!

    const promise = copy('hello')
    expect(loading.value).toBe(true)

    scope.stop()
    expect(loading.value).toBe(false)

    pending.resolve()
    await expect(promise).resolves.toBe(false)

    expect(copied.value).toBe(false)
    expect(loading.value).toBe(false)
  })

  it('reports support only when the Clipboard API or legacy fallback exists', () => {
    const unsupported = effectScope().run(() => useCopy())!
    expect(unsupported.isSupported.value).toBe(false)

    mockClipboard(vi.fn().mockResolvedValue(undefined))
    const secure = effectScope().run(() => useCopy())!
    expect(secure.isSupported.value).toBe(true)

    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false })
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn(() => true),
    })
    const fallback = effectScope().run(() => useCopy())!
    expect(fallback.isSupported.value).toBe(true)
  })

  it('clears the copied timer on dispose without resetting copied', async () => {
    mockClipboard(vi.fn().mockResolvedValue(undefined))

    const scope = effectScope()
    const { copied, copy } = scope.run(() => useCopy({ duration: 50 }))!

    await expect(copy('hello')).resolves.toBe(true)
    expect(vi.getTimerCount()).toBe(1)

    scope.stop()
    expect(vi.getTimerCount()).toBe(0)

    vi.advanceTimersByTime(50)
    expect(copied.value).toBe(true)
  })
})
