import type { AnyFunction } from '../types'

export interface ThrottleOptions {
  /** Invoke on the leading edge of the wait period. Defaults to true. */
  leading?: boolean
  /** Invoke on the trailing edge of the wait period. Defaults to true. */
  trailing?: boolean
}

export interface ThrottledFunction<T extends AnyFunction> {
  (...args: Parameters<T>): ReturnType<T> | undefined
  /** Cancels the pending trailing invocation and resets the throttle. */
  cancel(): void
  /** Immediately invokes the pending trailing call, if any. */
  flush(): ReturnType<T> | undefined
  /** Whether a trailing invocation is currently scheduled. */
  pending(): boolean
}

/**
 * Creates a throttled function that invokes `fn` at most once per `wait`
 * milliseconds.
 */
export function throttle<T extends AnyFunction>(
  fn: T,
  wait = 0,
  options: ThrottleOptions = {},
): ThrottledFunction<T> {
  const leading = options.leading ?? true
  const trailing = options.trailing ?? true

  interface PendingCall {
    thisArg: unknown
    args: Parameters<T>
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: PendingCall | undefined
  let result: ReturnType<T> | undefined
  let lastInvokeTime = 0
  let started = false

  function invoke(call: PendingCall, time: number) {
    lastInvokeTime = time
    result = fn.apply(call.thisArg, call.args) as ReturnType<T>
    return result
  }

  function startTimer(remaining: number) {
    timer = setTimeout(() => {
      timer = undefined
      if (trailing && pending) {
        const call = pending
        pending = undefined
        invoke(call, Date.now())
      } else {
        pending = undefined
      }
    }, remaining)
  }

  function throttled(this: unknown, ...args: Parameters<T>) {
    const now = Date.now()

    if (!started) {
      started = true
      lastInvokeTime = now

      if (leading) {
        return invoke({ thisArg: this, args }, now)
      }

      pending = { thisArg: this, args }
      if (trailing) startTimer(wait)
      else pending = undefined
      return result
    }

    const remaining = wait - (now - lastInvokeTime)

    if (remaining <= 0) {
      // With leading disabled, a call that lands exactly on the wait boundary
      // while the previous window's trailing timer is still pending belongs
      // to that window: clear the timer and invoke immediately instead of
      // dropping the old trailing call and starting another window.
      if (!leading && trailing && timer !== undefined) {
        clearTimeout(timer)
        timer = undefined
        pending = undefined
        return invoke({ thisArg: this, args }, now)
      }

      if (timer !== undefined) clearTimeout(timer)
      timer = undefined

      if (leading) {
        pending = undefined
        return invoke({ thisArg: this, args }, now)
      }

      // With leading disabled, each new window still invokes at its
      // trailing edge rather than immediately.
      lastInvokeTime = now
      pending = { thisArg: this, args }
      if (trailing) startTimer(wait)
      else pending = undefined
      return result
    }

    pending = { thisArg: this, args }
    if (timer === undefined && trailing) startTimer(remaining)
    return result
  }

  throttled.cancel = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    started = false
    lastInvokeTime = 0
    pending = undefined
  }

  throttled.flush = () => {
    if (timer === undefined) return result

    clearTimeout(timer)
    timer = undefined

    if (trailing && pending) {
      const call = pending
      pending = undefined
      return invoke(call, Date.now())
    }

    pending = undefined
    return result
  }

  throttled.pending = () => timer !== undefined

  return throttled
}
