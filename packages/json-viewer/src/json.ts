/**
 * Pretty-prints a JSON value for the read-only viewer.
 *
 * - JSON strings are parsed and re-indented when valid.
 * - Invalid JSON strings are rendered as-is.
 * - Circular references are replaced with a readable `"[Circular]"` marker.
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
  const seen = new WeakSet<object>()

  try {
    return (
      JSON.stringify(
        target,
        (_key, item: unknown) => {
          if (item !== null && typeof item === 'object') {
            if (seen.has(item)) return '[Circular]'
            seen.add(item)
          }
          return item
        },
        spaces,
      ) ?? String(value)
    )
  } catch {
    return String(value)
  }
}
