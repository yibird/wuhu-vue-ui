import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { copyText } from '../utils/copy'

describe('copyText', () => {
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(navigator, 'clipboard')
    Reflect.deleteProperty(window, 'isSecureContext')
    Reflect.deleteProperty(document, 'execCommand')
  })

  it('uses the async Clipboard API in secure contexts', async () => {
    await copyText('hello')

    expect(writeText).toHaveBeenCalledWith('hello')
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('falls back to execCommand when the Clipboard API is unavailable', async () => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false })
    const execCommand = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    })

    await copyText('fallback')

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('throws when the fallback is rejected and cleans up', async () => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false })
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn(() => false),
    })

    await expect(copyText('nope')).rejects.toThrow('rejected')
    expect(document.querySelector('textarea')).toBeNull()
  })

  it.each(['focus', 'select', 'setSelectionRange'] as const)(
    'removes the textarea and restores focus when %s throws',
    async (method) => {
      Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false })
      Object.defineProperty(document, 'execCommand', {
        configurable: true,
        value: vi.fn(() => true),
      })

      const active = document.createElement('button')
      document.body.appendChild(active)
      active.focus()

      vi.spyOn(
        HTMLTextAreaElement.prototype,
        method as 'focus' | 'select' | 'setSelectionRange',
      ).mockImplementation(() => {
        throw new Error(`${method} failed`)
      })

      await expect(copyText('nope')).rejects.toThrow(`${method} failed`)

      expect(document.querySelector('textarea')).toBeNull()
      expect(document.activeElement).toBe(active)

      active.remove()
    },
  )

  it('cleans up when execCommand throws', async () => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false })
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn(() => {
        throw new Error('exec failed')
      }),
    })

    await expect(copyText('nope')).rejects.toThrow('exec failed')
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('falls back instead of throwing when navigator is unavailable', async () => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true })
    const execCommand = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    })
    vi.stubGlobal('navigator', undefined)

    await expect(copyText('fallback')).resolves.toBeUndefined()

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea')).toBeNull()
  })
})
