export type EllipsisTooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface EllipsisProps {
  /** Text rendered when the default slot is not provided. */
  text?: string
  /** Maximum number of lines shown while collapsed. Defaults to `1`. */
  lines?: number
  /** Render an action button when the content overflows. */
  expandable?: boolean
  /** Whether the content is expanded. Supports `v-model:expanded`. */
  expanded?: boolean
  /** Show the full text in a tooltip while collapsed and overflowing. */
  tooltip?: boolean
  /**
   * Preferred tooltip placement relative to the content. Floating UI flips and
   * shifts it when there is not enough room.
   */
  tooltipPlacement?: EllipsisTooltipPlacement
  /** Root element tag. Defaults to `div`. */
  tag?: string
}

export interface EllipsisActionSlotProps {
  /** Current expanded state. */
  expanded: boolean
  /** Toggle the expanded state. */
  toggle: () => void
  /** Whether the content currently overflows. */
  overflowed: boolean
}

export interface EllipsisTooltipSlotProps {
  /** Full text exposed to the tooltip. */
  text: string
}
