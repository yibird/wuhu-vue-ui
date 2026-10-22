import { getCurrentScope, onScopeDispose, readonly, ref, watch, type Ref } from 'vue'
import type { AnyFunction } from '../utils/types'
import { throttle, type ThrottleOptions, type ThrottledFunction } from '../utils/throttle'

/**
 * Wraps a function with `throttle` and cancels the pending call when the
 * current effect scope is disposed.
 */
export function useThrottleFn<T extends AnyFunction>(
  fn: T,
  wait = 200,
  options?: ThrottleOptions,
): ThrottledFunction<T> {
  const throttled = throttle(fn, wait, options)

  if (getCurrentScope()) {
    onScopeDispose(throttled.cancel)
  }

  return throttled
}

/**
 * Returns a readonly ref that mirrors `source` at most once per `wait`
 * milliseconds.
 */
export function useThrottle<T>(source: Ref<T>, wait = 200) {
  const result = ref(source.value) as Ref<T>
  const update = useThrottleFn((value: T) => {
    result.value = value
  }, wait)

  watch(source, (value) => update(value), { flush: 'sync' })

  return readonly(result)
}
