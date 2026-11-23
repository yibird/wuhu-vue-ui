/**
 * Built-in presets. Each preset ships enter / leave / move transitions so
 * reordering and filtering the list both stay animated.
 */
export type MotionGroupAnimation = 'fade' | 'slide' | 'flip' | 'bounce'

/** Direction used by the `slide` preset. */
export type MotionGroupDirection = 'horizontal' | 'vertical'

export interface MotionGroupProps {
  /** Animation preset. Defaults to `fade`. */
  animation?: MotionGroupAnimation
  /** Slide direction. Defaults to `vertical` (slides in from the top). */
  direction?: MotionGroupDirection
  /** Tag of the rendered wrapper. Defaults to `div`. */
  tag?: string
  /** Animate the first render as well. */
  appear?: boolean
  /** Enter / leave duration in milliseconds. */
  duration?: number
  /** Move duration in milliseconds. Defaults to `duration`. */
  moveDuration?: number
  /**
   * Take leaving items out of the document flow so the remaining items can
   * slide into place immediately. Enabled by default.
   */
  absoluteLeave?: boolean
  /** Disable all transitions while keeping the list functional. */
  disabled?: boolean
}
