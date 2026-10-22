import type { TimeInput } from './relative'

export interface TimeProps {
  /** The date to display. Accepts Date, ISO string, timestamp in ms, or null. */
  time: TimeInput
  /** BCP 47 locale. */
  locale?: string
  /** Use "yesterday" style labels when natural. */
  numeric?: Intl.RelativeTimeFormatNumeric
  /** Relative format length. */
  formatStyle?: Intl.RelativeTimeFormatStyle
  /** Refresh interval in milliseconds. Set to 0 to disable auto refresh. */
  refreshInterval?: number
  /** Override the "now" source. Useful for tests and previews. */
  now?: TimeInput | (() => TimeInput)
  /** Show an absolute date/time in the native title tooltip. */
  showTitle?: boolean
  /** Intl options for the title tooltip. */
  titleFormat?: Intl.DateTimeFormatOptions
  /** Text rendered for invalid or missing dates. */
  emptyText?: string
  /** Root element tag. Defaults to the semantic `time` element. */
  tag?: string
  /** Fully custom relative formatter. */
  formatter?: (date: Date, now: Date, locale: string) => string
}

export interface TimeSlotProps {
  relative: string
  date: Date | null
  now: Date | null
  title: string | undefined
  datetime: string | undefined
  refresh: () => void
}
