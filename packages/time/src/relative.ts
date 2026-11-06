export type TimeInput = Date | string | number | null | undefined

export interface RelativeTimeOptions {
  /** BCP 47 locale. Defaults to zh-CN. */
  locale?: string
  /** Intl.RelativeTimeFormat numeric mode. */
  numeric?: Intl.RelativeTimeFormatNumeric
  /** Intl.RelativeTimeFormat length. */
  style?: Intl.RelativeTimeFormatStyle
}

const SECOND = 1_000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const MONTH = 30 * DAY
const YEAR = 365 * DAY

const relativeFormatterCache = new Map<string, Intl.RelativeTimeFormat | null>()
const dateTimeFormatterCache = new Map<string, Intl.DateTimeFormat | null>()

const FORMATTER_CACHE_LIMIT = 50

/**
 * Evicts the oldest inserted entry instead of clearing the whole cache, so a
 * hot locale/format combination is not discarded by an unrelated one.
 */
function evictOldest<K, V>(cache: Map<K, V>) {
  const oldest = cache.keys().next().value
  if (oldest !== undefined) cache.delete(oldest)
}

export function toDate(value: TimeInput): Date | null {
  if (value === null || value === undefined || value === '') return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'string') {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    if (dateOnly) {
      const year = Number(dateOnly[1])
      const month = Number(dateOnly[2])
      const day = Number(dateOnly[3])
      const date = new Date(0)
      date.setHours(0, 0, 0, 0)
      date.setFullYear(year, month - 1, day)
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null
      }
      return date
    }
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function createFormatter(locale: string, options: RelativeTimeOptions) {
  const numeric = options.numeric ?? 'auto'
  const style = options.style ?? 'long'
  const key = `${locale}|${numeric}|${style}`

  const cached = relativeFormatterCache.get(key)
  if (cached !== undefined) return cached

  let formatter: Intl.RelativeTimeFormat | null = null
  try {
    formatter = new Intl.RelativeTimeFormat(locale, { numeric, style })
  } catch {
    try {
      formatter = new Intl.RelativeTimeFormat(undefined, { numeric, style })
    } catch {
      formatter = null
    }
  }

  if (relativeFormatterCache.size >= FORMATTER_CACHE_LIMIT) evictOldest(relativeFormatterCache)
  relativeFormatterCache.set(key, formatter)
  return formatter
}

/**
 * Formats a date relative to `now`, for example "10分钟前" or "in 2 hours".
 * Past dates produce negative values; future dates produce positive values.
 */
export function formatRelativeTime(
  value: TimeInput,
  now: TimeInput = Date.now(),
  options: RelativeTimeOptions = {},
): string {
  const date = toDate(value)
  const current = toDate(now)
  if (!date || !current) return ''

  const locale = options.locale ?? 'zh-CN'
  const formatter = createFormatter(locale, options)
  const diff = date.getTime() - current.getTime()
  const absolute = Math.abs(diff)
  const sign = diff < 0 ? -1 : 1

  let amount: number
  let unit: Intl.RelativeTimeFormatUnit

  if (absolute < MINUTE) {
    amount = Math.floor(absolute / SECOND)
    unit = 'second'
  } else if (absolute < HOUR) {
    amount = Math.floor(absolute / MINUTE)
    unit = 'minute'
  } else if (absolute < DAY) {
    amount = Math.floor(absolute / HOUR)
    unit = 'hour'
  } else if (absolute < MONTH) {
    amount = Math.floor(absolute / DAY)
    unit = 'day'
  } else if (absolute < YEAR) {
    amount = Math.min(11, Math.floor(absolute / MONTH))
    unit = 'month'
  } else {
    amount = Math.floor(absolute / YEAR)
    unit = 'year'
  }

  const signedAmount = amount === 0 ? 0 : sign * amount

  if (formatter) {
    return formatter.format(signedAmount, unit)
  }

  // Minimal fallback for runtimes without Intl.RelativeTimeFormat.
  if (amount === 0) return 'just now'
  const suffix = unit.endsWith('s') ? unit : `${unit}s`
  return diff < 0 ? `${amount} ${suffix} ago` : `in ${amount} ${suffix}`
}

export function formatDateTime(
  value: TimeInput,
  locale = 'zh-CN',
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
  },
): string {
  const date = toDate(value)
  if (!date) return ''

  const key = `${locale}|${JSON.stringify(options)}`
  let formatter = dateTimeFormatterCache.get(key)
  if (formatter === undefined) {
    try {
      formatter = new Intl.DateTimeFormat(locale, options)
    } catch {
      formatter = null
    }
    if (dateTimeFormatterCache.size >= FORMATTER_CACHE_LIMIT) evictOldest(dateTimeFormatterCache)
    dateTimeFormatterCache.set(key, formatter)
  }

  if (!formatter) return date.toLocaleString()
  return formatter.format(date)
}
