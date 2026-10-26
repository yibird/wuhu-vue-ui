export interface LazyContainerProps {
  /** Scrollable ancestor or document viewport. */
  root?: Element | Document | null
  /** Margin around the root, using IntersectionObserver syntax. */
  rootMargin?: string
  /** Visibility threshold(s) between 0 and 1. */
  threshold?: number | number[]
  /** Stop observing after the first intersection. */
  once?: boolean
}

export interface LazyContainerSlotProps {
  isVisible: boolean
  hasEntered: boolean
  entry: IntersectionObserverEntry | null
}

export interface LazyContainerChangeEvent {
  isIntersecting: boolean
  entry: IntersectionObserverEntry
}
