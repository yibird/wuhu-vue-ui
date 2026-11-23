import { describe, expect, it } from 'vite-plus/test'
import { matchesShortcut, parseShortcut } from '../useShortcut'

function event(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, ...init })
}

describe('search panel shortcut', () => {
  it('maps Mod to Meta on Apple platforms and Ctrl elsewhere', () => {
    expect(parseShortcut('Mod+K', true)).toMatchObject({ meta: true, ctrl: false, key: 'k' })
    expect(parseShortcut('Mod+K', false)).toMatchObject({ ctrl: true, meta: false, key: 'k' })
  })

  it('parses case-insensitively and produces a label', () => {
    const parsed = parseShortcut('mod+shift+p', false)
    expect(parsed).toMatchObject({ ctrl: true, shift: true, key: 'p' })
    expect(parsed?.label).toContain('Ctrl')
    expect(parseShortcut('Mod+K', true)?.label).toBe('⌘ K')
  })

  it('returns null for disabled or invalid shortcuts', () => {
    expect(parseShortcut(false)).toBeNull()
    expect(parseShortcut('')).toBeNull()
    expect(parseShortcut('Hyper+K')).toBeNull()
  })

  it('matches modifiers exactly', () => {
    const parsed = parseShortcut('Ctrl+Shift+P', false)!
    expect(matchesShortcut(event('p', { ctrlKey: true, shiftKey: true }), parsed)).toBe(true)
    expect(matchesShortcut(event('p', { ctrlKey: true }), parsed)).toBe(false)
    expect(matchesShortcut(event('P', { ctrlKey: true, shiftKey: true }), parsed)).toBe(true)
  })
})
