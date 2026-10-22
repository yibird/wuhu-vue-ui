import { computed, getCurrentScope, onScopeDispose, ref } from 'vue'
import { copyText } from '../utils/copy'

export interface UseCopyOptions {
  /** How long `copied` stays true, in milliseconds or as a getter. Defaults to 1800. */
  duration?: number | (() => number)
  /** Called whenever a copy attempt succeeds. */
  onSuccess?: (text: string) => void
  /** Called whenever a copy attempt fails. */
  onError?: (error: Error) => void
}

/**
 * Reactive clipboard state around `copyText`.
 */
export function useCopy(options: UseCopyOptions = {}) {
  const copied = ref(false)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const isSupported = computed(
    () => typeof navigator !== 'undefined' && typeof document !== 'undefined',
  )

  let timer: ReturnType<typeof setTimeout> | undefined
  let disposed = false
  let generation = 0

  function clearTimer() {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  function reset() {
    generation++
    clearTimer()
    copied.value = false
    loading.value = false
    error.value = null
  }

  async function copy(text: string): Promise<boolean> {
    if (disposed || loading.value) return false

    const requestId = ++generation

    clearTimer()
    loading.value = true
    error.value = null

    try {
      await copyText(text)
      if (disposed || requestId !== generation) return false

      copied.value = true
      const duration =
        typeof options.duration === 'function' ? options.duration() : options.duration
      timer = setTimeout(() => {
        timer = undefined
        if (disposed || requestId !== generation) return
        copied.value = false
      }, duration ?? 1800)

      try {
        options.onSuccess?.(text)
      } catch {
        // Callback failures are outside the copy semantics.
      }

      return true
    } catch (cause) {
      if (disposed || requestId !== generation) return false

      const nextError = cause instanceof Error ? cause : new Error(String(cause))
      copied.value = false
      error.value = nextError

      try {
        options.onError?.(nextError)
      } catch {
        // Callback failures must not reject copy().
      }

      return false
    } finally {
      if (!disposed && requestId === generation) {
        loading.value = false
      }
    }
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      disposed = true
      clearTimer()
      loading.value = false
    })
  }

  return {
    copied,
    loading,
    error,
    isSupported,
    copy,
    reset,
  }
}
