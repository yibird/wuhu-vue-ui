import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vite-plus/test'
import Time from '../Time.vue'

const base = new Date(2026, 9, 19, 12, 0, 0)

describe('Time', () => {
  it('refresh re-reads a now getter even when it already returned a valid date', async () => {
    let fakeNow = new Date(base.getTime())
    const wrapper = mount(Time, {
      props: {
        time: new Date(base.getTime() - 60_000),
        now: () => fakeNow,
      },
    })

    expect(wrapper.text()).toBe('1分钟前')

    fakeNow = new Date(base.getTime() + 60_000)
    expect(wrapper.text()).toBe('1分钟前')

    ;(wrapper.vm as unknown as { refresh: () => void }).refresh()
    await nextTick()

    expect(wrapper.text()).toBe('2分钟前')
    expect(wrapper.emitted('refresh')).toHaveLength(1)
    wrapper.unmount()
  })
})
