import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'
import GradientText from '../GradientText.vue'

describe('GradientText', () => {
  it('renders a linear gradient and animation in milliseconds', () => {
    const wrapper = mount(GradientText, {
      props: {
        colors: ['#4f46e5', '#0ea5e9'],
        angle: 120,
        animate: true,
        duration: 4000,
      },
      slots: { default: 'Gradient' },
    })

    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.text()).toBe('Gradient')
    expect(wrapper.attributes('style')).toContain('linear-gradient(120deg')
    expect(wrapper.attributes('style')).toContain('4000ms')
    expect(wrapper.classes()).toContain('is-animated')
    wrapper.unmount()
  })

  it('uses the theme gradient tokens by default', () => {
    const wrapper = mount(GradientText, {
      slots: { default: 'Gradient' },
    })

    const style = wrapper.attributes('style')
    expect(style).toContain('var(--w-gradient-text-from, #4f46e5)')
    expect(style).toContain('var(--w-gradient-text-via, #9333ea)')
    expect(style).toContain('var(--w-gradient-text-to, #0369a1)')
    wrapper.unmount()
  })

  it('supports a raw background image', () => {
    const wrapper = mount(GradientText, {
      props: { gradient: 'conic-gradient(red, blue)' },
    })

    expect(wrapper.attributes('style')).toContain('conic-gradient(red, blue)')
    wrapper.unmount()
  })
})
