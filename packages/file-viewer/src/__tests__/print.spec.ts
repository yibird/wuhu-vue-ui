import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { printHtml, printUrl } from '../core/print'

afterEach(() => {
  vi.useRealTimers()
})

describe('print helpers', () => {
  it('reports a blocked popup', () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    expect(printUrl('https://example.com/sample.pdf')).toBe(false)
    expect(printHtml('Sample', '<p>content</p>')).toBe(false)
  })

  it('returns true and triggers printing when the window opens', () => {
    const popup = {
      opener: null,
      document: { open: vi.fn(), write: vi.fn(), close: vi.fn() },
      focus: vi.fn(),
      print: vi.fn(),
    } as unknown as Window
    vi.spyOn(window, 'open').mockReturnValue(popup)
    vi.useFakeTimers()

    expect(printHtml('Sample', '<p>content</p>')).toBe(true)
    vi.runAllTimers()
    expect(popup.print).toHaveBeenCalledTimes(1)
  })
})
