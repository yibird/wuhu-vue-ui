/**
 * Copies text with the async Clipboard API and falls back to a hidden
 * textarea for non-secure contexts and older browsers.
 *
 * Throws when the text could not be copied or when called outside a browser.
 */
export async function copyText(text: string): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('copyText() is only available in the browser')
  }

  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard?.writeText &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Permission can be denied. The legacy path is still worth trying.
    }
  }

  const textarea = document.createElement('textarea')
  const activeElement = document.activeElement as HTMLElement | null

  try {
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.setAttribute('aria-hidden', 'true')
    textarea.style.position = 'fixed'
    textarea.style.top = '0'
    textarea.style.left = '-9999px'
    textarea.style.opacity = '0'
    textarea.style.pointerEvents = 'none'

    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, text.length)

    if (!document.execCommand('copy')) {
      throw new Error('The browser rejected the copy command')
    }
  } finally {
    textarea.remove()
    activeElement?.focus({ preventScroll: true })
  }
}
