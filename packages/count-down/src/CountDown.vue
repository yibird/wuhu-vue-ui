<script setup lang="ts">
import { useIntervalFn } from '@wuhu-ui/core'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatCountdown } from './format'
import type { CountDownProps, CountDownState } from './types'

defineOptions({
  name: 'WCountDown',
})

const props = withDefaults(defineProps<CountDownProps>(), {
  target: undefined,
  duration: 0,
  autoStart: true,
  interval: 1000,
  format: 'HH:mm:ss',
  finishText: undefined,
  tag: 'span',
})

const emit = defineEmits<{
  'update:remaining': [remaining: number]
  change: [state: CountDownState]
  start: []
  pause: []
  reset: []
  finish: []
}>()

defineSlots<{
  default?: (props: CountDownState) => unknown
  finished?: (props: CountDownState) => unknown
}>()

const DAY = 86_400_000
const HOUR = 3_600_000
const MINUTE = 60_000
const SECOND = 1_000
const DEFAULT_INTERVAL = 1_000

const remaining = ref(0)
const running = ref(false)
const finished = ref(false)

const days = computed(() => Math.floor(remaining.value / DAY))
const hours = computed(() => Math.floor(remaining.value / HOUR) % 24)
const minutes = computed(() => Math.floor(remaining.value / MINUTE) % 60)
const seconds = computed(() => Math.floor(remaining.value / SECOND) % 60)
const milliseconds = computed(() => remaining.value % SECOND)

const state = computed<CountDownState>(() => ({
  remaining: remaining.value,
  days: days.value,
  hours: hours.value,
  minutes: minutes.value,
  seconds: seconds.value,
  milliseconds: milliseconds.value,
  running: running.value,
  finished: finished.value,
}))

const formatted = computed(() => {
  if (typeof props.format === 'function') return props.format(state.value)
  return formatCountdown(remaining.value, props.format)
})

let startedAt = 0
let baseRemaining = 0
let unmounted = false

function resolveTarget(): number | null {
  if (props.target === undefined) return null

  let time: number
  if (props.target instanceof Date) {
    time = props.target.getTime()
  } else if (typeof props.target === 'number') {
    time = props.target
  } else {
    time = new Date(props.target).getTime()
  }

  return Number.isFinite(time) ? time : null
}

function getInitialRemaining(): number {
  const targetTime = resolveTarget()
  if (targetTime !== null) return Math.max(0, targetTime - Date.now())

  const duration = Number.isFinite(props.duration) ? props.duration : 0
  return Math.max(0, Math.floor(duration))
}

function emitRemaining(value: number) {
  if (value === remaining.value) return
  remaining.value = value
  emit('update:remaining', value)
  emit('change', state.value)
}

const timer = useIntervalFn(updateRemaining, () =>
  Number.isFinite(props.interval) && props.interval > 0 ? props.interval : DEFAULT_INTERVAL,
)

function clearTimer() {
  timer.stop()
}

function schedule() {
  timer.start()
}

function finish() {
  if (finished.value) return

  clearTimer()
  running.value = false
  finished.value = true

  if (remaining.value !== 0) {
    remaining.value = 0
    emit('update:remaining', 0)
  }

  emit('change', state.value)
  emit('finish')
}

function updateRemaining() {
  if (!running.value) return

  const targetTime = resolveTarget()
  const next =
    targetTime !== null ? targetTime - Date.now() : baseRemaining - (Date.now() - startedAt)

  const clamped = Math.max(0, Math.floor(next))
  emitRemaining(clamped)

  if (remaining.value <= 0) finish()
}

function start() {
  if (running.value) return

  clearTimer()

  if (finished.value || remaining.value <= 0) {
    finished.value = false
    remaining.value = getInitialRemaining()
    emit('update:remaining', remaining.value)
  }

  running.value = true
  baseRemaining = remaining.value
  startedAt = Date.now()
  emit('start')
  emit('change', state.value)

  if (remaining.value <= 0) {
    finish()
    return
  }

  schedule()
}

function pause() {
  if (!running.value) return

  updateRemaining()
  if (!running.value) return

  clearTimer()
  running.value = false
  emit('pause')
  emit('change', state.value)
}

function reset() {
  clearTimer()
  running.value = false
  finished.value = false

  const initial = getInitialRemaining()
  remaining.value = initial
  emit('update:remaining', initial)
  emit('reset')

  if (props.autoStart) start()
  else emit('change', state.value)
}

watch(
  // Compare Date targets by timestamp so re-creating a Date on every parent
  // render does not restart the countdown.
  () => [resolveTarget(), props.duration],
  () => {
    if (unmounted) return

    clearTimer()
    running.value = false
    finished.value = false
    remaining.value = getInitialRemaining()
    emit('update:remaining', remaining.value)

    if (props.autoStart) start()
    else emit('change', state.value)
  },
)

remaining.value = getInitialRemaining()

onMounted(() => {
  // Never create timers during SSR setup.
  if (props.autoStart) start()
})

onBeforeUnmount(() => {
  unmounted = true
  clearTimer()
})

defineExpose({
  remaining,
  running,
  finished,
  days,
  hours,
  minutes,
  seconds,
  milliseconds,
  start,
  pause,
  reset,
})
</script>

<template>
  <component
    :is="tag"
    class="w-count-down"
    :class="{ 'is-running': state.running, 'is-finished': state.finished }"
  >
    <template v-if="state.finished">
      <slot name="finished" v-bind="state">
        <template v-if="finishText !== undefined">{{ finishText }}</template>
        <template v-else>{{ formatted }}</template>
      </slot>
    </template>
    <slot v-else v-bind="state">{{ formatted }}</slot>
  </component>
</template>
