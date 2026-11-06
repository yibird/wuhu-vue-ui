/**
 * Pretty-prints a JSON value for the read-only viewer.
 *
 * - JSON strings are parsed and re-indented when valid.
 * - Invalid JSON strings are rendered as-is.
 * - Only true cycles are replaced with `"[Circular]"`; shared references are
 *   preserved in full.
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

  const spaces = Number.isFinite(indent) ? Math.min(10, Math.max(0, Math.trunc(indent))) : 2

  // Track the current ancestor chain, not every visited object: a value shared
  // by two sibling properties is valid JSON and must not become `[Circular]`.
  const ancestors: object[] = []

  try {
    return (
      JSON.stringify(
        target,
        function (this: unknown, _key, item: unknown) {
          if (typeof item === 'bigint') return item.toString()
          if (item === null || typeof item !== 'object') return item

          while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) {
            ancestors.pop()
          }
          if (ancestors.includes(item)) return '[Circular]'

          ancestors.push(item)
          return item
        },
        spaces,
      ) ?? String(value)
    )
  } catch {
    return String(value)
  }
}
