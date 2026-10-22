const DAY = 86_400_000
const HOUR = 3_600_000
const MINUTE = 60_000
const SECOND = 1_000

/**
 * Formats a remaining millisecond value using `DD`, `HH`, `mm`, `ss` and
 * `SSS` tokens. Unknown characters are kept as-is.
 */
export function formatCountdown(remaining: number, format = 'HH:mm:ss'): string {
  const total = Math.max(0, Math.floor(Number.isFinite(remaining) ? remaining : 0))
  const days = Math.floor(total / DAY)
  const hours = Math.floor(total / HOUR) % 24
  const minutes = Math.floor(total / MINUTE) % 60
  const seconds = Math.floor(total / SECOND) % 60
  const milliseconds = total % SECOND

  const values: Record<string, string> = {
    DD: String(days).padStart(2, '0'),
    HH: String(hours).padStart(2, '0'),
    mm: String(minutes).padStart(2, '0'),
    ss: String(seconds).padStart(2, '0'),
    SSS: String(milliseconds).padStart(3, '0'),
  }

  return format.replace(/DD|HH|mm|ss|SSS/g, (token) => values[token] ?? token)
}
