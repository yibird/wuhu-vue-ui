let lockCount = 0
let previousOverflow = ''

/**
 * Reference-counted body scroll lock shared by every editor instance in the
 * module. One editor leaving fullscreen must not unlock the page while another
 * editor is still fullscreen.
 */
export function lockBodyScroll(): void {
  if (typeof document === 'undefined') return

  if (lockCount === 0) previousOverflow = document.body.style.overflow
  lockCount += 1
  document.body.style.overflow = 'hidden'
}

export function unlockBodyScroll(): void {
  if (typeof document === 'undefined' || lockCount === 0) return

  lockCount -= 1
  if (lockCount === 0) document.body.style.overflow = previousOverflow
}
