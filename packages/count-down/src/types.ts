export interface CountDownProps {
  /**
   * Target moment. When present it is the ongoing source of the countdown:
   * every tick is computed as `target - now`. An external `remaining` update
   * can override the value momentarily, but subsequent ticks return to
   * `target`.
   */
  target?: Date | string | number
  /**
   * Countdown length in milliseconds. Used only when `target` is absent.
   * Prefer using a single driving source per countdown.
   */
  duration?: number
  /**
   * Remaining milliseconds and the `v-model:remaining` output.
   *
   * Initial-value precedence: `remaining` > `target` > `duration`.
   * When provided while running, an external update immediately sets the value
   * and restarts the elapsed-time base. If `target` is also set, the next tick
   * resumes from `target`; use only one of the three as the driver.
   */
  remaining?: number
  /** Start counting as soon as the component is mounted. Defaults to `true`. */
  autoStart?: boolean
  /** Tick interval in milliseconds. Defaults to `1000`. */
  interval?: number
  /** Format string with `DD`, `HH`, `mm`, `ss`, `SSS`, or a custom formatter. */
  format?: string | ((state: CountDownState) => string)
  /** Content shown instead of the countdown once it reaches zero. */
  finishText?: string
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
