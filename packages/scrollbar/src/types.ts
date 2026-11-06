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
  /** Semantic class names for the wrapper, view and thumbs. */
  classes?: ScrollbarClasses
  /** Semantic inline styles for the wrapper, view and thumbs. */
  styles?: ScrollbarStyles
  /** Disable automatic resize observation. updatePosition() still works. */
  noresize?: boolean
  /** Always keep the custom scrollbars visible. */
  always?: boolean
}

export interface ScrollbarScrollEvent {
  scrollTop: number
  scrollLeft: number
}
