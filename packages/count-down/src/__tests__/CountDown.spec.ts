import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import CountDown from '../CountDown.vue'
import { formatCountdown } from '../format'
import type { CountDownState } from '../types'

interface CountDownVm {
  remaining: number
  running: boolean
  finished: boolean
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
  start: () => void
  pause: () => void
  reset: () => void
}

function getVm(wrapper: ReturnType<typeof mount>): CountDownVm {
  return wrapper.vm as unknown as CountDownVm
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('formatCountdown', () => {
  it('formats all supported tokens', () => {
    expect(formatCountdown(90_061_007, 'DD HH:mm:ss SSS')).toBe('01 01:01:01 007')
  })

  it('uses HH:mm:ss by default and clamps negative values', () => {
    expect(formatCountdown(3_661_000)).toBe('01:01:01')
    expect(formatCountdown(-500)).toBe('00:00:00')
    expect(formatCountdown(0)).toBe('00:00:00')
  })

  it('keeps unknown tokens untouched', () => {
    expect(formatCountdown(65_000, '剩余 mm 分 ss 秒')).toBe('剩余 01 分 05 秒')
  })
})

describe('CountDown', () => {
  it('renders the default format and ticks down', async () => {
    const wrapper = mount(CountDown, { props: { duration: 5_000 } })
    const vm = getVm(wrapper)

    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.text()).toBe('00:00:05')
    expect(vm.remaining).toBe(5_000)
    expect(vm.running).toBe(true)

    vi.advanceTimersByTime(1_000)
    await nextTick()

    expect(vm.remaining).toBe(4_000)
    expect(vm.seconds).toBe(4)
    expect(wrapper.text()).toBe('00:00:04')
    expect(wrapper.emitted('update:remaining')?.at(-1)).toEqual([4_000])

    wrapper.unmount()
  })

  it('counts down to a target timestamp', async () => {
    const target = Date.now() + 3_000
    const wrapper = mount(CountDown, { props: { target } })
    const vm = getVm(wrapper)

    expect(vm.remaining).toBe(3_000)

    vi.advanceTimersByTime(1_000)
    await nextTick()

    expect(vm.remaining).toBe(2_000)
    expect(vm.seconds).toBe(2)

    wrapper.unmount()
  })

  it('pauses and resumes from the saved remaining time', async () => {
    const wrapper = mount(CountDown, { props: { duration: 3_000 } })
    const vm = getVm(wrapper)

    vi.advanceTimersByTime(1_000)
    await nextTick()
    expect(vm.remaining).toBe(2_000)

    vm.pause()
    expect(vm.running).toBe(false)
    expect(wrapper.emitted('pause')).toHaveLength(1)

    vi.advanceTimersByTime(5_000)
    await nextTick()
    expect(vm.remaining).toBe(2_000)

    vm.start()
    expect(vm.running).toBe(true)

    vi.advanceTimersByTime(1_000)
    await nextTick()
    expect(vm.remaining).toBe(1_000)

    wrapper.unmount()
  })

  it('resets to the initial duration and restarts when autoStart is on', async () => {
    const wrapper = mount(CountDown, { props: { duration: 3_000 } })
    const vm = getVm(wrapper)

    vi.advanceTimersByTime(2_000)
    await nextTick()
    expect(vm.remaining).toBe(1_000)

    vm.reset()
    expect(vm.remaining).toBe(3_000)
    expect(vm.running).toBe(true)
    expect(wrapper.emitted('reset')).toHaveLength(1)

    wrapper.unmount()
  })

  it('does not start when autoStart is false', async () => {
    const wrapper = mount(CountDown, {
      props: { duration: 2_000, autoStart: false },
    })
    const vm = getVm(wrapper)

    expect(vm.running).toBe(false)

    vi.advanceTimersByTime(5_000)
    await nextTick()
    expect(vm.remaining).toBe(2_000)

    vm.start()
    vi.advanceTimersByTime(1_000)
    await nextTick()
    expect(vm.remaining).toBe(1_000)

    wrapper.unmount()
  })

  it('emits finish only once and renders finishText', async () => {
    const wrapper = mount(CountDown, {
      props: { duration: 1_000, finishText: '已结束' },
    })
    const vm = getVm(wrapper)

    vi.advanceTimersByTime(5_000)
    await nextTick()

    expect(wrapper.emitted('finish')).toHaveLength(1)
    expect(vm.finished).toBe(true)
    expect(vm.running).toBe(false)
    expect(wrapper.text()).toBe('已结束')

    vi.advanceTimersByTime(5_000)
    await nextTick()
    expect(wrapper.emitted('finish')).toHaveLength(1)

    wrapper.unmount()
  })

  it('supports v-model:remaining and follows external updates', async () => {
    const remaining = ref(5_000)
    const Host = defineComponent({
      setup() {
        return () =>
          h(CountDown, {
            duration: 5_000,
            remaining: remaining.value,
            'onUpdate:remaining': (value: number) => {
              remaining.value = value
            },
          })
      },
    })

    const wrapper = mount(Host)
    expect(wrapper.text()).toBe('00:00:05')

    vi.advanceTimersByTime(1_000)
    await nextTick()

    expect(remaining.value).toBe(4_000)
    expect(wrapper.text()).toBe('00:00:04')

    remaining.value = 2_000
    await nextTick()
    expect(wrapper.text()).toBe('00:00:02')

    vi.advanceTimersByTime(1_000)
    await nextTick()
    expect(remaining.value).toBe(1_000)

    wrapper.unmount()
  })

  it('resets a controlled countdown to its full duration', async () => {
    const remaining = ref(1_000)
    const Host = defineComponent({
      setup() {
        return () =>
          h(CountDown, {
            duration: 3_000,
            remaining: remaining.value,
            'onUpdate:remaining': (value: number) => {
              remaining.value = value
            },
          })
      },
    })

    const wrapper = mount(Host)
    vi.advanceTimersByTime(2_000)
    await nextTick()
    expect(remaining.value).toBe(0)

    const child = wrapper.findComponent(CountDown)
    ;(child.vm as unknown as { reset: () => void }).reset()
    await nextTick()

    expect(remaining.value).toBe(3_000)
    wrapper.unmount()
  })

  it('finishes when an externally controlled remaining value becomes zero while paused', async () => {
    const wrapper = mount(CountDown, { props: { remaining: 5_000, autoStart: false } })
    const vm = getVm(wrapper)

    vm.start()
    vm.pause()
    await wrapper.setProps({ remaining: 0 })

    expect(vm.finished).toBe(true)
    expect(vm.running).toBe(false)
    expect(wrapper.emitted('finish')).toHaveLength(1)
    expect(wrapper.emitted('change')?.at(-1)?.[0]).toMatchObject({ remaining: 0, finished: true })

    await wrapper.setProps({ remaining: 0 })
    expect(wrapper.emitted('finish')).toHaveLength(1)

    await wrapper.setProps({ remaining: 1_000 })
    expect(vm.finished).toBe(false)
    wrapper.unmount()
  })

  it('finishes when an externally controlled remaining value is zero before starting', async () => {
    const wrapper = mount(CountDown, { props: { remaining: 1_000, autoStart: false } })
    const vm = getVm(wrapper)

    await wrapper.setProps({ remaining: 0 })

    expect(vm.finished).toBe(true)
    expect(vm.running).toBe(false)
    expect(wrapper.emitted('finish')).toHaveLength(1)
    wrapper.unmount()
  })

  it('emits change only once when reaching zero', async () => {
    const wrapper = mount(CountDown, { props: { duration: 1_000 } })

    vi.advanceTimersByTime(5_000)
    await nextTick()

    const changes = wrapper.emitted('change') ?? []
    expect(changes.filter(([state]) => (state as CountDownState).finished)).toHaveLength(1)
    expect(changes.at(-1)?.[0]).toMatchObject({ remaining: 0, finished: true })
    expect(wrapper.emitted('update:remaining')?.filter(([value]) => value === 0)).toHaveLength(1)

    wrapper.unmount()
  })

  it('restarts when duration changes and keeps autoStart behaviour', async () => {
    const wrapper = mount(CountDown, { props: { duration: 2_000 } })
    const vm = getVm(wrapper)

    vi.advanceTimersByTime(1_000)
    await nextTick()
    expect(vm.remaining).toBe(1_000)

    await wrapper.setProps({ duration: 5_000 })
    await nextTick()

    expect(vm.remaining).toBe(5_000)
    expect(vm.running).toBe(true)

    wrapper.unmount()
  })

  it('exposes state to the default and finished slots', async () => {
    const wrapper = mount(CountDown, {
      props: { duration: 2_000 },
      slots: {
        default: (state: CountDownState) => h('span', { class: 'live' }, `${state.seconds}`),
        finished: (state: CountDownState) =>
          h('span', { class: 'done' }, state.finished ? 'done' : 'waiting'),
      },
    })

    expect(wrapper.get('.live').text()).toBe('2')
    expect(wrapper.find('.done').exists()).toBe(false)

    vi.advanceTimersByTime(3_000)
    await nextTick()

    expect(wrapper.find('.live').exists()).toBe(false)
    expect(wrapper.get('.done').text()).toBe('done')

    wrapper.unmount()
  })

  it('uses a custom formatter function', () => {
    const wrapper = mount(CountDown, {
      props: {
        duration: 65_000,
        format: (state: CountDownState) => `${state.minutes}m ${state.seconds}s`,
      },
    })

    expect(wrapper.text()).toBe('1m 5s')
    wrapper.unmount()
  })

  it('clears its timer on unmount', () => {
    const wrapper = mount(CountDown, { props: { duration: 10_000 } })

    expect(vi.getTimerCount()).toBe(1)

    wrapper.unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
