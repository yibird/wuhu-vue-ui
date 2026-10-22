export interface CountDownProps {
  /** Target moment. Takes precedence over `duration`. */
  target?: Date | string | number
  /** Countdown length in milliseconds. */
  duration?: number
  /** Start counting as soon as the component is mounted. Defaults to `true`. */
  autoStart?: boolean
  /** Tick interval in milliseconds. Defaults to `1000`. */
  interval?: number
  /** Format string with `DD`, `HH`, `mm`, `ss`, `SSS`, or a custom formatter. */
  format?: string | ((state: CountDownState) => string)
  /** Content shown instead of the countdown once it reaches zero. */
  finishText?: string
  /** Root element tag. Defaults to `span`. */
  tag?: string
}

export interface CountDownState {
  /** Remaining milliseconds, never negative. */
  remaining: number
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
  running: boolean
  finished: boolean
}
