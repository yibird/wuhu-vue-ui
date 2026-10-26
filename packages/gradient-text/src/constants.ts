/**
 * Default gradient stops. Each stop references the theme token so the same
 * component adapts to light and dark themes; fallbacks keep inline usage
 * readable before the stylesheet loads.
 */
export const DEFAULT_GRADIENT_COLORS = [
  'var(--w-gradient-text-from, #4f46e5)',
  'var(--w-gradient-text-via, #9333ea)',
  'var(--w-gradient-text-to, #0369a1)',
]
