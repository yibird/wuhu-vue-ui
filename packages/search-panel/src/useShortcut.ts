export interface ParsedShortcut {
  ctrl: boolean
  meta: boolean
  alt: boolean
  shift: boolean
  key: string
  label: string
}

const KEY_LABELS: Record<string, string> = {
  escape: 'Esc',
  esc: 'Esc',
  enter: 'Enter',
  ' ': 'Space',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
}

function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  const platform = nav.userAgentData?.platform ?? nav.platform ?? nav.userAgent
  return /mac|iphone|ipad|ipod/i.test(platform)
}

function keyLabel(key: string, apple: boolean): string {
  if (KEY_LABELS[key]) return KEY_LABELS[key]
  if (key.length === 1) return apple ? key.toUpperCase() : key.toUpperCase()
  return key.charAt(0).toUpperCase() + key.slice(1)
}

/**
 * Parse a shortcut such as `Mod+K`, `Ctrl+Shift+P` or `Alt+/`.
 * Returns null for disabled or invalid input.
 */
export function parseShortcut(
  input: string | false | undefined,
  apple = isApplePlatform(),
): ParsedShortcut | null {
  if (!input) return null

  const tokens = input
    .split('+')
    .map((token) => token.trim())
    .filter(Boolean)
  if (tokens.length === 0) return null

  const key = tokens.pop()
  if (!key) return null

  const parsed: ParsedShortcut = {
    ctrl: false,
    meta: false,
    alt: false,
    shift: false,
    key: key.toLowerCase(),
    label: '',
  }

  for (const token of tokens) {
    switch (token.toLowerCase()) {
      case 'mod':
        if (apple) parsed.meta = true
        else parsed.ctrl = true
        break
      case 'ctrl':
      case 'control':
        parsed.ctrl = true
        break
      case 'meta':
      case 'cmd':
      case 'command':
        parsed.meta = true
        break
      case 'alt':
      case 'option':
        parsed.alt = true
        break
      case 'shift':
        parsed.shift = true
        break
      default:
        return null
    }
  }

  const parts: string[] = []
  if (parsed.ctrl) parts.push(apple ? '⌃' : 'Ctrl')
  if (parsed.alt) parts.push(apple ? '⌥' : 'Alt')
  if (parsed.shift) parts.push(apple ? '⇧' : 'Shift')
  if (parsed.meta) parts.push(apple ? '⌘' : 'Meta')
  parts.push(keyLabel(parsed.key, apple))

  parsed.label = parts.join(apple ? ' ' : ' + ')
  return parsed
}

export function matchesShortcut(event: KeyboardEvent, parsed: ParsedShortcut): boolean {
  return (
    event.key.toLowerCase() === parsed.key &&
    event.ctrlKey === parsed.ctrl &&
    event.metaKey === parsed.meta &&
    event.altKey === parsed.alt &&
    event.shiftKey === parsed.shift
  )
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"]',
    ),
  )
}
