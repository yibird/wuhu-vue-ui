function legacyCopyText(text: string) {
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

    const succeeded = document.execCommand('copy')
    if (!succeeded) {
      throw new Error('Copy failed: the browser rejected the copy command')
    }
  } finally {
    textarea.remove()

    if (activeElement && document.contains(activeElement)) {
      try {
        activeElement.focus({ preventScroll: true })
      } catch {
        // 忽略焦点恢复失败
      }
    }
  }
}

export async function copyText(text: string): Promise<void> {
  if (!text) return
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
    } catch {}
  }
  legacyCopyText(text)
}
