export type ResizeBox = 'content-box' | 'border-box' | 'device-pixel-content-box'

export interface ResizeContainerProps {
  /** Observation box passed to ResizeObserver. */
  box?: ResizeBox
  /** Debounce delay in milliseconds. Useful for expensive responsive layouts. */
  debounce?: number
  /** Emit an initial resize event when mounted. */
  immediate?: boolean
  /** Stop observation and events. */
  disabled?: boolean
  /** Root element tag. */
  tag?: string
}

export interface ResizeContainerResizeEvent {
  width: number
  height: number
  contentRect: DOMRectReadOnly
  borderBoxSize: readonly ResizeObserverSize[] | null
  contentBoxSize: readonly ResizeObserverSize[] | null
  devicePixelContentBoxSize: readonly ResizeObserverSize[] | null
  entry: ResizeObserverEntry | null
}

export interface ResizeContainerSlotProps {
  width: number
  height: number
  entry: ResizeObserverEntry | null
}
