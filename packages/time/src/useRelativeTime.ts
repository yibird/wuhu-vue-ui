import { useIntervalFn } from '@wuhu-ui/core'
import {
  computed,
  getCurrentInstance,
  getCurrentScope,
  onMounted,
  onScopeDispose,
  ref,
  toValue,
  unref,
  watch,
} from 'vue'
import type { ComputedRef, MaybeRef, MaybeRefOrGetter } from 'vue'
import { formatRelativeTime, toDate } from './relative'
import type { TimeInput } from './relative'

export interface UseRelativeTimeOptions {
  /** The date to display. Accepts Date, ISO string, timestamp in ms, or null. */
  time: MaybeRefOrGetter<TimeInput>
  /** BCP 47 locale. Defaults to zh-CN. */
  locale?: MaybeRefOrGetter<string | undefined>
  /** Use "yesterday" style labels when natural. */
  numeric?: MaybeRefOrGetter<Intl.RelativeTimeFormatNumeric | undefined>
  /** Relative format length. */
  style?: MaybeRefOrGetter<Intl.RelativeTimeFormatStyle | undefined>
  /** Override the "now" source. Auto refresh is disabled while it yields a value. */
  now?: MaybeRefOrGetter<TimeInput | (() => TimeInput)>
  /** Refresh interval in milliseconds. Set to 0 to disable auto refresh. */
  refreshInterval?: MaybeRefOrGetter<number | undefined>
  /** Text rendered for invalid or missing dates. Defaults to an empty string. */
  emptyText?: MaybeRefOrGetter<string | undefined>
  /** Fully custom relative formatter. */
  formatter?: MaybeRef<((date: Date, now: Date, locale: string) => string) | undefined>
  /** Called after every refresh, including automatic timer ticks. */
  onRefresh?: (now: Date) => void
}

export interface UseRelativeTimeReturn {
  /** Parsed target date, or `null` when the input is invalid. */
  date: ComputedRef<Date | null>
  /** The current reference date. */
  now: ComputedRef<Date | null>
  /** The formatted relative time, or `emptyText`. */
  relative: ComputedRef<string>
  /** Re-read the current time and update all computed values. */
  refresh: () => void
  /** Stop the auto-refresh timer. */
  stop: () => void
}

const DEFAULT_REFRESH_INTERVAL = 30_000

/**
 * Reactive relative time state with optional auto refresh.
 *
 * Inside a component the timer starts on mount; inside an effect scope it
 * starts immediately. Standalone calls without a scope do not auto-start
 * because nothing could dispose the timer.
 */
export function useRelativeTime(options: UseRelativeTimeOptions): UseRelativeTimeReturn {
  const nowMs = ref(Date.now())

  function resolveNowSource(): TimeInput {
    const source = toValue(options.now)
    return typeof source === 'function' ? source() : source
  }

  const date = computed(() => toDate(toValue(options.time)))

  const now = computed(() => {
    // Always read the refresh tick so `refresh()` invalidates the computed
    // value even when a `now` getter returns a valid date. Reading it is cheap
    // and cached; with a static `now` the observable behaviour is unchanged.
    const refreshedAt = nowMs.value
    if (options.now === undefined) return new Date(refreshedAt)

    const source = toValue(options.now)
    if (typeof source === 'function') return toDate(source()) ?? new Date(refreshedAt)
    return source === undefined ? new Date(refreshedAt) : toDate(source)
  })

  const relative = computed(() => {
    const target = date.value
    const current = now.value
    if (!target || !current) return toValue(options.emptyText) ?? ''

    const locale = toValue(options.locale) ?? 'zh-CN'
    const formatter = unref(options.formatter)
    if (formatter) return formatter(target, current, locale)

    return formatRelativeTime(target, current, {
      locale,
      numeric: toValue(options.numeric),
      style: toValue(options.style),
    })
  })

  function refresh() {
    nowMs.value = Date.now()
    options.onRefresh?.(new Date(nowMs.value))
  }

  const intervalFn = useIntervalFn(
    refresh,
    () => toValue(options.refreshInterval) ?? DEFAULT_REFRESH_INTERVAL,
  )

  function stopTimer() {
    intervalFn.stop()
  }

  function startTimer() {
    stopTimer()

    const interval = toValue(options.refreshInterval) ?? DEFAULT_REFRESH_INTERVAL
    if (interval <= 0 || typeof window === 'undefined') return
    if (options.now !== undefined && resolveNowSource() !== undefined) return

    intervalFn.start()
  }

  const hasScope = Boolean(getCurrentScope())
  if (hasScope) {
    watch([() => toValue(options.refreshInterval), () => toValue(options.now)], () => startTimer())
  }

  if (getCurrentInstance()) {
    onMounted(startTimer)
  } else if (getCurrentScope()) {
    // Outside a scope there is nothing that could dispose the timer.
    startTimer()
  }

  if (getCurrentScope()) {
    onScopeDispose(stopTimer)
  }

  return {
    date,
    now,
    stop: stopTimer,
    relative,
    refresh,
  }
}
