import {
  computed,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'

export interface UseControllableStateOptions<T> {
  /** Controlled value. When `undefined`, the internal state is used. */
  value?: MaybeRefOrGetter<T | undefined>
  /** Initial value for uncontrolled usage. */
  defaultValue: T
  /** Normalize a proposed value before comparing/emitting. */
  normalize?: (value: T) => T
  /** Called whenever a new value is accepted. */
  onChange?: (value: T) => void
}

export interface UseControllableStateReturn<T> {
  value: ComputedRef<T>
  setValue: (next: T) => void
  isControlled: ComputedRef<boolean>
}

/**
 * Controlled/uncontrolled state with an optional normalizer. In controlled
 * mode the returned value always follows the prop; `setValue` only emits.
 */
export function useControllableState<T>(
  options: UseControllableStateOptions<T>,
): UseControllableStateReturn<T> {
  const internal = ref(options.defaultValue) as Ref<T>
  const isControlled = computed(() => toValue(options.value) !== undefined)

  const value = computed<T>(() => {
    const controlled = toValue(options.value)
    if (controlled === undefined) return internal.value
    return options.normalize ? options.normalize(controlled) : controlled
  })

  function setValue(next: T) {
    const normalized = options.normalize ? options.normalize(next) : next
    if (normalized === value.value) return

    if (!isControlled.value) internal.value = normalized
    options.onChange?.(normalized)
  }

  watch(
    () => toValue(options.value),
    (controlled) => {
      if (controlled === undefined) return
      internal.value = options.normalize ? options.normalize(controlled) : controlled
    },
  )

  return { value, setValue, isControlled }
}
