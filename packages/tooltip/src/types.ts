export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  /** Text content. The `content` slot takes precedence when provided. */
  content?: string
  /** Preferred placement; Floating UI flips it when there is not enough space. */
  placement?: TooltipPlacement
  /** Distance from the reference element, in pixels. */
  offset?: number
  /** Delay before showing, in milliseconds. */
  showDelay?: number
  /** Delay before hiding, in milliseconds. */
  hideDelay?: number
  /** Keep the tooltip closed and ignore trigger events. */
  disabled?: boolean
  /** Controlled visibility. When omitted the trigger manages the state. */
  open?: boolean
  /**
   * Position against an external element instead of wrapping the default slot.
   * Anchor mode renders only the floating layer; mount it conditionally.
   */
  anchor?: HTMLElement | null
  /** Teleport the floating layer. Defaults to `true`. */
  teleport?: boolean
  /** Teleport target. Defaults to `body`. */
  teleportTo?: string | HTMLElement
}

export interface TooltipContentSlotProps {
  content?: string
}

export interface TooltipDirectiveOptions {
  content: string
  placement?: TooltipPlacement
  offset?: number
  showDelay?: number
  hideDelay?: number
  disabled?: boolean
}

export type TooltipDirectiveValue = string | TooltipDirectiveOptions | null | undefined | false
