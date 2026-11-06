import {
  getCurrentScope,
  onScopeDispose,
  readonly,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'
import { debounce, type DebounceOptions, type DebouncedFunction } from '../utils/debounce'
import type { AnyFunction } from '../types'

/**
 * Wraps a function with `debounce` and cancels the pending call when the
 * current effect scope is disposed.
 */
export function useDebounceFn<T extends AnyFunction>(
  fn: T,
  wait = 200,
  options?: DebounceOptions,
): DebouncedFunction<T> {
  const debounced = debounce(fn, wait, options)

  if (getCurrentScope()) {
    onScopeDispose(debounced.cancel)
  }

  return debounced
}

/**
 * Returns a readonly ref that mirrors `source` after `wait` milliseconds
 * without changes.
 */
export function useDebounce<T>(source: MaybeRefOrGetter<T>, wait = 200) {
  const result = ref(toValue(source)) as Ref<T>
  const update = useDebounceFn((value: T) => {
    result.value = value
  }, wait)

  watch(
    () => toValue(source),
    (value) => update(value),
    { flush: 'sync' },
  )

  return readonly(result)
}
