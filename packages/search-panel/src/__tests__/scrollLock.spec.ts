import { afterEach, describe, expect, it } from 'vite-plus/test'
import { lockScroll, unlockScroll } from '../useScrollLock'

afterEach(() => {
  document.body.style.overflow = ''
  document.documentElement.style.scrollbarGutter = ''
})

describe('search panel scroll lock', () => {
  it('uses reference counting until the last unlock', () => {
    lockScroll()
    lockScroll()
    expect(document.body.style.overflow).toBe('hidden')

    unlockScroll()
    expect(document.body.style.overflow).toBe('hidden')

    unlockScroll()
    expect(document.body.style.overflow).toBe('')
  })

  it('reserves the scrollbar gutter and restores previous inline styles', () => {
    document.body.style.overflow = 'auto'
    document.documentElement.style.scrollbarGutter = 'auto'

    lockScroll()
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.documentElement.style.scrollbarGutter).toBe('stable')

    unlockScroll()

    expect(document.body.style.overflow).toBe('auto')
    expect(document.documentElement.style.scrollbarGutter).toBe('auto')
  })
})
