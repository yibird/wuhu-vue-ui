export interface RippleOptions {
  /** Wave color. Defaults to `currentColor`. */
  color?: string
  /** Animation duration in milliseconds. Defaults to `600`. */
  duration?: number
  /** Prevent new waves from being created. */
  disabled?: boolean
  /** Expand from the element center instead of the pointer position. */
  center?: boolean
  /** Event that starts the ripple. Defaults to `pointerdown`. */
  trigger?: 'pointerdown' | 'click'
}

export interface RippleProps extends RippleOptions {
  /** Root element tag. Defaults to `span`. */
  tag?: string
}
