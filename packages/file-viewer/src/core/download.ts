export function triggerDownload(blob: Blob, name: string) {
  if (typeof document === 'undefined') return
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name || 'download'
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'blob:'])

export function isSafeExternalUrl(url: string): boolean {
  if (typeof window === 'undefined' || !url) return false

  try {
    const parsed = new URL(url, window.location.href)
    return SAFE_PROTOCOLS.has(parsed.protocol)
  } catch {
    return false
  }
}

export function openInNewTab(url: string): boolean {
  if (typeof window === 'undefined' || !url || !isSafeExternalUrl(url)) return false

  const parsed = new URL(url, window.location.href)
  const win = window.open(parsed.href, '_blank')
  if (!win) return false
  win.opener = null
  return true
}
