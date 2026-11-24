const DESCRIBED_BY = 'aria-describedby'

function readTokens(element: HTMLElement): string[] {
  return (element.getAttribute(DESCRIBED_BY) ?? '').split(/\s+/).filter(Boolean)
}

/**
 * Adds the tooltip id without clobbering ids the host already references.
 */
export function addDescribedBy(element: HTMLElement | null | undefined, id: string) {
  if (!element) return
  const tokens = readTokens(element)
  if (tokens.includes(id)) return
  tokens.push(id)
  element.setAttribute(DESCRIBED_BY, tokens.join(' '))
}

export function removeDescribedBy(element: HTMLElement | null | undefined, id: string) {
  if (!element) return
  const tokens = readTokens(element).filter((token) => token !== id)
  if (tokens.length > 0) {
    element.setAttribute(DESCRIBED_BY, tokens.join(' '))
  } else {
    element.removeAttribute(DESCRIBED_BY)
  }
}

/**
 * Mirrors a scoped `data-w-theme` onto the teleported layer. When the theme is
 * set on `<html>` the descendant rule already matches, so this is harmless.
 */
export function resolveTheme(element: HTMLElement | null | undefined): string | null {
  const scope = element?.closest('[data-w-theme]')
  const theme = scope?.getAttribute('data-w-theme')
  return theme === 'dark' || theme === 'light' ? theme : null
}
