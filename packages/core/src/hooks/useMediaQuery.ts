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

/**
 * Reactive `matchMedia` wrapper. Re-subscribes when the query changes and
 * removes the listener on scope disposal.
 */
export function useMediaQuery(query: MaybeRefOrGetter<string>): Readonly<Ref<boolean>> {
  const matches = ref(false)
  let mediaQuery: MediaQueryList | undefined

  const handleChange = (event: MediaQueryListEvent): void => {
    matches.value = event.matches
  }

  function stop(): void {
    if (!mediaQuery) return
    if (typeof mediaQuery.removeEventListener === 'function') {
      mediaQuery.removeEventListener('change', handleChange)
    } else {
      mediaQuery.removeListener(handleChange)
    }
    mediaQuery = undefined
  }

  function start(): void {
    stop()
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      matches.value = false
      return
    }

    mediaQuery = window.matchMedia(toValue(query))
    matches.value = mediaQuery.matches
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      mediaQuery.addListener(handleChange)
    }
  }

  watch(() => toValue(query), start, { immediate: true })

  if (getCurrentScope()) onScopeDispose(stop)

  return readonly(matches)
}

/** Reactive `prefers-reduced-motion: reduce`. */
export function usePrefersReducedMotion(): Readonly<Ref<boolean>> {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
