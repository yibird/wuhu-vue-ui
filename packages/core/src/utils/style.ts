/**
 * Converts a numeric size to pixels while passing strings through unchanged.
 * `undefined`, `null` and empty strings resolve to `undefined` so callers can
 * omit the style entry entirely.
 */
export function toCssUnit(value: string | number | null | undefined) {
  if (value === undefined || value === null || value === '') return
  return typeof value === 'number' ? `${value}px` : value
}

/** Alias kept for components that historically called the helper `toCssSize`. */
export const toCssSize = toCssUnit
