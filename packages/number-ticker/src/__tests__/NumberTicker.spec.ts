import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'
import NumberTicker from '../NumberTicker.vue'

describe('NumberTicker', () => {
  it('formats localized numbers and exposes an accessible label', () => {
    const wrapper = mount(NumberTicker, {
      props: {
        value: 1234.5,
        decimals: 1,
        locale: 'en-US',
        animateOnMount: false,
        prefix: '$',
      },
    })

    expect(wrapper.attributes('aria-label')).toBe('$1,234.5')
    expect(wrapper.findAll('.w-number-ticker__digit')).toHaveLength(5)
    wrapper.unmount()
  })

  it('updates its accessible value and digits when the value changes', async () => {
    const wrapper = mount(NumberTicker, {
      props: {
        value: 99,
        locale: 'en-US',
        animateOnMount: false,
      },
    })

    await wrapper.setProps({ value: 100 })

    expect(wrapper.attributes('aria-label')).toBe('100')
    expect(wrapper.findAll('.w-number-ticker__digit')).toHaveLength(3)
    wrapper.unmount()
  })

  it('supports localized digit glyphs', () => {
    const wrapper = mount(NumberTicker, {
      props: {
        value: 123,
        locale: 'ar-EG',
        animateOnMount: false,
      },
    })

    expect(wrapper.findAll('.w-number-ticker__digit')).toHaveLength(3)
    const digits = wrapper.findAll('.w-number-ticker__strip > span')
    expect(digits[0]?.text()).not.toBe('0')
    wrapper.unmount()
  })
})
