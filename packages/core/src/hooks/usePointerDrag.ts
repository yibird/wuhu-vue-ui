import { getCurrentScope, onScopeDispose } from 'vue'

export interface UsePointerDragOptions {
  /** Called for pointermove events that match the active pointer. */
  onMove?: (event: PointerEvent) => void
  /** Called once when the active pointer is released. */
  onEnd?: (event: PointerEvent) => void
  /** Called once when the active pointer is cancelled. */
  onCancel?: (event: PointerEvent) => void
}

export interface UsePointerDragReturn {
  /** Start tracking window-level pointer events for the given pointerdown. */
  start: (event: PointerEvent) => void
  /** Stop tracking and release window listeners. Safe to call repeatedly. */
  stop: () => void
  /** The pointer id currently being tracked, or `null`. */
  pointerId: () => number | null
}

/**
 * Tracks a single pointer gesture with window-level move/up/cancel listeners.
 * Pointer ids are filtered so a second finger cannot move an active drag.
 */
export function usePointerDrag(options: UsePointerDragOptions = {}): UsePointerDragReturn {
  let activePointerId: number | null = null

  const matches = (event: PointerEvent) =>
    activePointerId === null || event.pointerId === activePointerId

  const handleMove = (event: PointerEvent) => {
    if (!matches(event)) return
    options.onMove?.(event)
  }

  const handleEnd = (event: PointerEvent) => {
    if (!matches(event)) return
    stop()
    options.onEnd?.(event)
  }

  const handleCancel = (event: PointerEvent) => {
    if (!matches(event)) return
    stop()
    options.onCancel?.(event)
  }

  function start(event: PointerEvent): void {
    if (activePointerId !== null || typeof window === 'undefined') return
    activePointerId = event.pointerId
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleEnd)
    window.addEventListener('pointercancel', handleCancel)
  }

  function stop(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleEnd)
      window.removeEventListener('pointercancel', handleCancel)
    }
    activePointerId = null
  }

  if (getCurrentScope()) onScopeDispose(stop)

  return {
    start,
    stop,
    pointerId: () => activePointerId,
  }
}
