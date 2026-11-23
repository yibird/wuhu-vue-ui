const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getClientRects().length > 0,
  )
}

/** Keep Tab / Shift+Tab inside the panel. */
export function trapTab(event: KeyboardEvent, container: HTMLElement | null) {
  if (!container) return

  const elements = focusableElements(container)
  if (elements.length === 0) {
    event.preventDefault()
    container.focus({ preventScroll: true })
    return
  }

  const current = document.activeElement
  const index = current instanceof HTMLElement ? elements.indexOf(current) : -1
  const lastIndex = elements.length - 1

  if (event.shiftKey) {
    if (index <= 0) {
      event.preventDefault()
      elements[lastIndex]?.focus({ preventScroll: true })
    }
    return
  }

  if (index === -1 || index === lastIndex) {
    event.preventDefault()
    elements[0]?.focus({ preventScroll: true })
  }
}
