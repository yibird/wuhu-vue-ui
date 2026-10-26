export interface NumberTickerProps {
  /** Target value to display. */
  value: number
  /** Value the digits start from when mounted. */
  startValue?: number
  /** Roll animation duration in milliseconds. */
  duration?: number
  /** Number of fraction digits. */
  decimals?: number
  /** BCP 47 locale used for formatting. */
  locale?: string
  /** Enable locale-aware thousands separators. */
  useGrouping?: boolean
  prefix?: string
  suffix?: string
  /** CSS timing function for each digit wheel. */
  easing?: string
  /** Animate from startValue to value on first mount. */
  animateOnMount?: boolean
  /**
   * Optional live-region politeness for the accessible label. Omit to keep the
   * ticker as a static `role="img"` label.
   */
  ariaLive?: 'off' | 'polite' | 'assertive'
  /** Whether a live region announces the whole label. Defaults to the browser default. */
  ariaAtomic?: boolean
}

export interface NumberTickerCharacter {
  char: string
  digit: number | null
}
