import { getCurrentScope, onScopeDispose } from 'vue'

export interface UseRafReturn {
  /** Schedule the callback for the next frame (no-op while already pending). */
  schedule: () => void
  /** Cancel a pending frame. */
  cancel: () => void
  /** Whether a frame is currently scheduled. */
  isPending: () => boolean
}

/**
 * One-shot requestAnimationFrame scheduler with automatic cleanup. Callbacks
 * can call `schedule()` again to build a loop.
 */
export function useRaf(callback: (time: number) => void): UseRafReturn {
  let frame = 0

  function cancel() {
    if (!frame) return
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
    frame = 0
  }

  function schedule() {
    if (frame || typeof requestAnimationFrame !== 'function') return
    frame = requestAnimationFrame((time) => {
      frame = 0
      callback(time)
    })
  }

  if (getCurrentScope()) onScopeDispose(cancel)

  return { schedule, cancel, isPending: () => frame !== 0 }
}
