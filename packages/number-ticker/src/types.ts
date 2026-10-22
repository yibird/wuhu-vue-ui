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
}

export interface NumberTickerCharacter {
  char: string
  digit: number | null
}
