import type { AnyFunction } from '../types'

export interface DebounceOptions {
  /** Invoke on the leading edge of the wait period. Defaults to false. */
  leading?: boolean
  /** Invoke on the trailing edge of the wait period. Defaults to true. */
  trailing?: boolean
}

export interface DebouncedFunction<T extends AnyFunction> {
  (...args: Parameters<T>): ReturnType<T> | undefined
  /** Cancels the pending invocation. */
  cancel(): void
  /** Immediately invokes the pending trailing call, if any. */
  flush(): ReturnType<T> | undefined
  /** Whether an invocation is currently scheduled. */
  pending(): boolean
}

/**
 * Creates a debounced function that delays invoking `fn` until `wait`
 * milliseconds have elapsed since the last call.
 */
export function debounce<T extends AnyFunction>(
  fn: T,
  wait = 0,
  options: DebounceOptions = {},
): DebouncedFunction<T> {
  const leading = options.leading ?? false
  const trailing = options.trailing ?? true

  interface PendingCall {
    thisArg: unknown
    args: Parameters<T>
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  let pendingCall: PendingCall | undefined
  let lastCallTime: number | undefined
  let result: ReturnType<T> | undefined

  function invokeFunc() {
    const call = pendingCall as PendingCall

    pendingCall = undefined
    result = fn.apply(call.thisArg, call.args) as ReturnType<T>
    return result
  }

  function shouldInvoke(time: number) {
    if (lastCallTime === undefined) return true

    const timeSinceLastCall = time - lastCallTime
    // Also invoke when the clock moved backwards.
    return timeSinceLastCall >= wait || timeSinceLastCall < 0
  }

  function remainingWait(time: number) {
    return wait - (time - (lastCallTime as number))
  }

  function leadingEdge() {
    timer = setTimeout(timerExpired, wait)
    return leading ? invokeFunc() : result
  }

  function timerExpired() {
    const time = Date.now()

    if (shouldInvoke(time)) {
      return trailingEdge()
    }

    timer = setTimeout(timerExpired, remainingWait(time))
  }

  function trailingEdge() {
    timer = undefined

    if (trailing && pendingCall !== undefined) {
      return invokeFunc()
    }

    pendingCall = undefined
    return result
  }

  function debounced(this: unknown, ...args: Parameters<T>) {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    pendingCall = { thisArg: this, args }
    lastCallTime = time

    if (isInvoking && timer === undefined) {
      return leadingEdge()
    }

    if (timer === undefined) {
      timer = setTimeout(timerExpired, wait)
    }

    return result
  }

  debounced.cancel = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    pendingCall = undefined
    lastCallTime = undefined
  }

  debounced.flush = () => {
    if (timer === undefined) return result
    clearTimeout(timer)
    timer = undefined
    return trailingEdge()
  }

  debounced.pending = () => trailing && pendingCall !== undefined

  return debounced
}
