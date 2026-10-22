/**
 * Pretty-prints a JSON value for the read-only viewer.
 *
 * - JSON strings are parsed and re-indented when valid.
 * - Invalid JSON strings are rendered as-is.
 * - Circular values fall back to `String(value)`.
 */
export function formatJsonValue(value: unknown, indent = 2): string {
  if (value === undefined) return ''

  let target = value

  if (typeof value === 'string') {
    if (!value.trim()) return ''
    try {
      target = JSON.parse(value)
    } catch {
      return value
    }
  }

  const spaces = Math.min(10, Math.max(0, Math.trunc(indent)))

  try {
    return JSON.stringify(target, null, spaces) ?? String(value)
  } catch {
    return String(value)
  }
}
