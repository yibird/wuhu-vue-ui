let lockCount = 0
let previousOverflow = ''
let previousPaddingRight = ''

export function lockBodyScroll() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return

  if (lockCount === 0) {
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth)

    previousOverflow = document.body.style.overflow
    previousPaddingRight = document.body.style.paddingRight
    document.body.style.overflow = 'hidden'

    // Compensate for the disappearing scrollbar so opening the overlay does
    // not shift the page horizontally.
    if (scrollbarWidth > 0) {
      const currentPadding = Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0
      document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`
    }
  }

  lockCount += 1
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined' || lockCount === 0) return

  lockCount -= 1
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow
    document.body.style.paddingRight = previousPaddingRight
  }
}
