import {
  getCurrentScope,
  onScopeDispose,
  readonly,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'

export interface UseIntervalFnOptions {
  /** Invoke the callback immediately when the interval starts. */
  immediate?: boolean
}

export interface UseIntervalFnReturn {
  start: () => void
  stop: () => void
  restart: () => void
  isActive: Readonly<Ref<boolean>>
}

/** Interval with pause/resume and automatic cleanup. */
export function useIntervalFn(
  callback: () => void,
  interval: MaybeRefOrGetter<number>,
  options: UseIntervalFnOptions = {},
): UseIntervalFnReturn {
  const active = ref(false)
  let timer: ReturnType<typeof setInterval> | undefined

  function stop(): void {
    if (timer !== undefined) clearInterval(timer)
    timer = undefined
    active.value = false
  }

  function start(): void {
    stop()
    const delay = toValue(interval)
    if (!Number.isFinite(delay) || delay <= 0) return

    if (options.immediate) callback()
    timer = setInterval(callback, delay)
    active.value = true
  }

  function restart(): void {
    start()
  }

  watch(
    () => toValue(interval),
    () => {
      if (active.value) start()
    },
  )

  if (getCurrentScope()) onScopeDispose(stop)

  return { start, stop, restart, isActive: readonly(active) }
}

export interface UseTimeoutFnReturn {
  start: () => void
  stop: () => void
  isPending: Readonly<Ref<boolean>>
}

/** Timeout with pending state and automatic cleanup. */
export function useTimeoutFn(
  callback: () => void,
  delay: MaybeRefOrGetter<number>,
): UseTimeoutFnReturn {
  const pending = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  function stop(): void {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    pending.value = false
  }

  function start(): void {
    stop()
    const wait = toValue(delay)
    if (!Number.isFinite(wait) || wait < 0) return

    pending.value = true
    timer = setTimeout(() => {
      timer = undefined
      pending.value = false
      callback()
    }, wait)
  }

  watch(
    () => toValue(delay),
    () => {
      if (pending.value) start()
    },
  )

  if (getCurrentScope()) onScopeDispose(stop)

  return { start, stop, isPending: readonly(pending) }
}
