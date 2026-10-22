import { toValue, type MaybeRefOrGetter } from 'vue'
import { clamp } from '../utils/math'

export interface UseListNavigationOptions<T> {
  /** Items currently reachable by the keyboard. */
  items: MaybeRefOrGetter<T[]>
  /** Number of columns for grid navigation. Defaults to 1 (linear list). */
  columns?: MaybeRefOrGetter<number>
  /** Wrap at the ends. Defaults to true for menus; use false for grids. */
  loop?: boolean
  /** Current active index, or null/undefined when nothing is highlighted. */
  activeIndex?: MaybeRefOrGetter<number | null | undefined>
  /** Move the visual focus to `index`. */
  onHighlight: (index: number) => void
  /** Activate the item at the current index (Enter). */
  onActivate?: (item: T, index: number) => void
  /** Skip navigation while an IME candidate list is open. */
  isComposing?: () => boolean
}

export interface UseListNavigationReturn {
  /** Handles Arrow/Home/End/Enter. Returns true when the event was used. */
  handleKeydown: (event: KeyboardEvent) => boolean
  move: (step: number) => boolean
  first: () => boolean
  last: () => boolean
}

/**
 * Shared keyboard navigation for linear menus and grid lists. The caller owns
 * focus management through `onHighlight` and activation through `onActivate`.
 */
export function useListNavigation<T>(
  options: UseListNavigationOptions<T>,
): UseListNavigationReturn {
  const items = () => toValue(options.items)
  const columns = () => Math.max(1, toValue(options.columns) ?? 1)

  function currentIndex(): number | null {
    const index = toValue(options.activeIndex)
    if (index === null || index === undefined) return null
    if (index < 0 || index >= items().length) return null
    return index
  }

  function highlight(index: number): boolean {
    if (items().length === 0) return false
    options.onHighlight(index)
    return true
  }

  function move(step: number): boolean {
    const list = items()
    if (list.length === 0) return false

    const current = currentIndex()
    if (current === null) {
      return highlight(step < 0 ? list.length - 1 : 0)
    }

    let next = current + step
    if (options.loop ?? true) {
      next = ((next % list.length) + list.length) % list.length
    } else {
      next = clamp(next, 0, list.length - 1)
    }
    return highlight(next)
  }

  function first(): boolean {
    return highlight(0)
  }

  function last(): boolean {
    return highlight(items().length - 1)
  }

  function activate(): boolean {
    const index = currentIndex()
    if (index === null || !options.onActivate) return false
    options.onActivate(items()[index]!, index)
    return true
  }

  function handleKeydown(event: KeyboardEvent): boolean {
    if (options.isComposing?.() || event.isComposing) return false

    const grid = columns()
    let handled = false

    switch (event.key) {
      case 'ArrowDown':
      case 'Down':
        handled = move(grid)
        break
      case 'ArrowUp':
      case 'Up':
        handled = move(-grid)
        break
      case 'ArrowRight':
        if (grid > 1) handled = move(1)
        break
      case 'ArrowLeft':
        if (grid > 1) handled = move(-1)
        break
      case 'Home':
        handled = first()
        break
      case 'End':
        handled = last()
        break
      case 'Enter':
        handled = activate()
        break
      default:
        return false
    }

    if (handled) event.preventDefault()
    return handled
  }

  return { handleKeydown, move, first, last }
}
