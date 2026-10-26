import type { StyleValue } from 'vue'

export type ScrollbarDirection = 'top' | 'bottom' | 'left' | 'right'

export type ScrollbarClassValue =
  | string
  | Record<string, boolean>
  | (string | Record<string, boolean>)[]

export interface ScrollbarClasses {
  /** Class names applied to the scrolling wrapper. */
  wrap?: ScrollbarClassValue
  /** Class names applied to the inner view. */
  view?: ScrollbarClassValue
  /** Class names applied to both scrollbar thumbs, regardless of direction. */
  thumb?: ScrollbarClassValue
}

export interface ScrollbarStyles {
  /** Inline styles applied to the scrolling wrapper. */
  wrap?: StyleValue
  /** Inline styles applied to the inner view. */
  view?: StyleValue
  /** Inline styles applied to both scrollbar thumbs, regardless of direction. */
  thumb?: StyleValue
}

export interface ScrollbarProps {
  /** Height of the scrollbar viewport. Numbers are converted to pixels. */
  height?: string | number
  /** Maximum height of the scrollbar viewport. Numbers are converted to pixels. */
  maxHeight?: string | number
  /** Use the browser's native scrollbar instead of the custom overlay bars. */
  native?: boolean
  /** Semantic class names for the wrapper, view and thumbs. */
  classes?: ScrollbarClasses
  /** Semantic inline styles for the wrapper, view and thumbs. */
  styles?: ScrollbarStyles
  /** Disable automatic resize observation. update() still works. */
  noresize?: boolean
  /** Element tag used for the inner view. */
  tag?: string
  /** Always keep the custom scrollbars visible. */
  always?: boolean
  /** Minimum thumb length in pixels. */
  minSize?: number
  /** ID of the inner view. */
  id?: string
  /**
   * Distance from the edge, in pixels, that triggers the `end` event.
   * When greater than 0, `end` is emitted once each time the scroll
   * position reaches the top, bottom, left or right edge.
   */
  distance?: number
}

export interface ScrollbarScrollEvent {
  scrollTop: number
  scrollLeft: number
}
