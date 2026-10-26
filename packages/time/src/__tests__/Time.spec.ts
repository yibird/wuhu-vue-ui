import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vite-plus/test'
import Time from '../Time.vue'

const base = new Date(2026, 9, 19, 12, 0, 0)

describe('Time', () => {
  it('binds datetime only on the semantic time element', () => {
    const semantic = mount(Time, { props: { time: base } })
    expect(semantic.element.tagName).toBe('TIME')
    expect(semantic.attributes('datetime')).toBe(base.toISOString())
    semantic.unmount()

    const span = mount(Time, { props: { time: base, tag: 'span' } })
    expect(span.element.tagName).toBe('SPAN')
    expect(span.attributes('datetime')).toBeUndefined()
    span.unmount()
  })

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
