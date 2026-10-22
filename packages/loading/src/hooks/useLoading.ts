import { ref } from 'vue'
import type { UseLoadingReturn } from '../types'

/**
 * Lightweight visibility state for declarative loading usage.
 */
export function useLoading(initial = false): UseLoadingReturn {
  const visible = ref(initial)

  return {
    visible,
    open: () => {
      visible.value = true
    },
    close: () => {
      visible.value = false
    },
    toggle: () => {
      visible.value = !visible.value
    },
  }
}
