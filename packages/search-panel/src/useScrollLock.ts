let count = 0
let previousOverflow = ''
let previousGutter = ''

/**
 * Lock body scrolling while at least one panel is open.
 *
 * Reserving the scrollbar space with `scrollbar-gutter: stable` keeps the page
 * width unchanged when `overflow: hidden` hides the scrollbar, which avoids the
 * layout jump a padding compensation can introduce.
 */
export function lockScroll() {
  if (typeof document === 'undefined') return

  if (count === 0) {
    const root = document.documentElement
    const hasScrollbar = window.innerWidth - root.clientWidth > 0
    previousOverflow = document.body.style.overflow
    previousGutter = root.style.scrollbarGutter

    if (hasScrollbar) root.style.scrollbarGutter = 'stable'
    document.body.style.overflow = 'hidden'
  }

  count += 1
}

/** Release one scroll lock. The original styles are restored at zero. */
export function unlockScroll() {
  if (typeof document === 'undefined' || count === 0) return

  count -= 1
  if (count === 0) {
    document.body.style.overflow = previousOverflow
    document.documentElement.style.scrollbarGutter = previousGutter
  }
}
