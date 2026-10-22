import { effectScope, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { useRelativeTime } from '../useRelativeTime'

const base = new Date(2026, 9, 19, 12, 0, 0)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(base)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useRelativeTime', () => {
  it('derives the relative label from a fixed now', () => {
    const scope = effectScope()
    const { date, now, relative } = scope.run(() =>
      useRelativeTime({
        time: new Date(base.getTime() - 10 * 60_000),
        now: base,
      }),
    )!

    expect(date.value?.getTime()).toBe(base.getTime() - 10 * 60_000)
    expect(now.value?.getTime()).toBe(base.getTime())
    expect(relative.value).toBe('10分钟前')

    scope.stop()
  })

  it('reacts to source and locale changes', () => {
    const time = ref<Date>(new Date(base.getTime() - 60_000))
    const locale = ref('zh-CN')
    const scope = effectScope()
    const { relative } = scope.run(() => useRelativeTime({ time, now: base, locale }))!

    expect(relative.value).toBe('1分钟前')

    time.value = new Date(base.getTime() - 2 * 60_000)
    locale.value = 'en-US'
    expect(relative.value).toBe('2 minutes ago')

    scope.stop()
  })

  it('uses emptyText for invalid and missing dates', () => {
    const scope = effectScope()
    const { relative } = scope.run(() =>
      useRelativeTime({ time: null, now: base, emptyText: '--' }),
    )!

    expect(relative.value).toBe('--')

    scope.stop()
  })

  it('supports a custom formatter', () => {
    const scope = effectScope()
    const { relative } = scope.run(() =>
      useRelativeTime({
        time: new Date(base.getTime() - 3 * 86_400_000),
        now: base,
        formatter: (date, now) =>
          `${Math.round((now.getTime() - date.getTime()) / 86_400_000)} 天前`,
      }),
    )!

    expect(relative.value).toBe('3 天前')

    scope.stop()
  })

  it('refreshes automatically and stops after scope disposal', () => {
    const onRefresh = vi.fn()
    const scope = effectScope()
    const { now } = scope.run(() =>
      useRelativeTime({
        time: new Date(base.getTime() - 10 * 60_000),
        refreshInterval: 1_000,
        onRefresh,
      }),
    )!

    expect(now.value?.getTime()).toBe(base.getTime())

    vi.advanceTimersByTime(1_000)
    expect(now.value?.getTime()).toBe(base.getTime() + 1_000)
    expect(onRefresh).toHaveBeenCalledOnce()

    scope.stop()
    vi.advanceTimersByTime(5_000)
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('does not auto refresh while a now source is provided', () => {
    const onRefresh = vi.fn()
    const scope = effectScope()
    const { now } = scope.run(() =>
      useRelativeTime({
        time: base,
        now: base,
        refreshInterval: 1_000,
        onRefresh,
      }),
    )!

    vi.advanceTimersByTime(5_000)

    expect(now.value?.getTime()).toBe(base.getTime())
    expect(onRefresh).not.toHaveBeenCalled()

    scope.stop()
  })
})
