import { describe, expect, it } from 'vite-plus/test'
import { formatRelativeTime, toDate } from '../relative'

const now = new Date(2026, 9, 19, 12, 0, 0)

describe('formatRelativeTime', () => {
  it('formats minutes and hours in Chinese', () => {
    expect(
      formatRelativeTime(new Date(now.getTime() - 10 * 60_000), now, { locale: 'zh-CN' }),
    ).toBe('10分钟前')
    expect(
      formatRelativeTime(new Date(now.getTime() - 60 * 60_000), now, { locale: 'zh-CN' }),
    ).toBe('1小时前')
  })

  it('uses natural day labels with numeric=auto', () => {
    expect(
      formatRelativeTime(new Date(now.getTime() - 24 * 60 * 60_000), now, {
        locale: 'zh-CN',
      }),
    ).toBe('昨天')
  })

  it('supports numeric=always and future dates', () => {
    expect(
      formatRelativeTime(new Date(now.getTime() - 24 * 60 * 60_000), now, {
        locale: 'zh-CN',
        numeric: 'always',
      }),
    ).toBe('1天前')
    expect(
      formatRelativeTime(new Date(now.getTime() + 2 * 60 * 60_000), now, {
        locale: 'zh-CN',
      }),
    ).toBe('2小时后')
  })

  it('supports other locales', () => {
    expect(
      formatRelativeTime(new Date(now.getTime() - 10 * 60_000), now, { locale: 'en-US' }),
    ).toBe('10 minutes ago')
  })

  it('returns an empty string for invalid dates', () => {
    expect(formatRelativeTime('not-a-date', now)).toBe('')
    expect(formatRelativeTime(null, now)).toBe('')
  })

  it('parses date-only strings as local calendar dates', () => {
    const date = toDate('2026-10-19')
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(9)
    expect(date?.getDate()).toBe(19)
  })

  it('parses years from 0001 through 0099 and rejects invalid calendar dates', () => {
    expect(toDate('0001-01-01')?.getFullYear()).toBe(1)
    expect(toDate('0099-12-31')?.getFullYear()).toBe(99)
    expect(toDate('0099-02-29')).toBeNull()
    expect(toDate('2024-02-29')?.getDate()).toBe(29)
  })
})
