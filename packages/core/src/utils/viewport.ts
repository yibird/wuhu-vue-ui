import { clamp } from './math'

export interface ViewportSize {
  width: number
  height: number
}

export interface ClampToViewportOptions {
  /** Minimum distance from each viewport edge. Defaults to 8. */
  margin?: number
  /** Override the viewport size, useful for tests and SSR. */
  viewport?: ViewportSize
}

/**
 * Keeps a floating element inside the viewport. `x`/`y` are the desired
 * top-left coordinates; `size` is the measured element size.
 */
export function clampToViewport(
  x: number,
  y: number,
  size: ViewportSize,
  options: ClampToViewportOptions = {},
): { x: number; y: number } {
  const margin = options.margin ?? 8
  const viewport =
    options.viewport ??
    (typeof window === 'undefined'
      ? { width: 0, height: 0 }
      : { width: window.innerWidth, height: window.innerHeight })

  const maxX = Math.max(margin, viewport.width - size.width - margin)
  const maxY = Math.max(margin, viewport.height - size.height - margin)

  return {
    x: clamp(x, margin, maxX),
    y: clamp(y, margin, maxY),
  }
}
