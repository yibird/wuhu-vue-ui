import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'
import Icon from '../Icon.vue'
import { normalizeIconName, registerIcon, resolveIcon } from '../icons'

describe('Icon', () => {
  it('renders a known Lucide icon', () => {
    const wrapper = mount(Icon, { props: { name: 'i-lucide:chevron-up' } })

    expect(wrapper.element.tagName).toBe('svg')
    expect(wrapper.findAll('path')).toHaveLength(1)
    expect(wrapper.get('path').attributes('d')).toBe('m18 15-6-6-6 6')
    wrapper.unmount()
  })

  it('normalizes names and supports registration', () => {
    expect(normalizeIconName('i-lucide:chevron-up')).toBe('chevron-up')
    expect(normalizeIconName('lucide:chevron-left')).toBe('chevron-left')
    expect(normalizeIconName('check')).toBe('check')

    registerIcon('custom-glyph', 'M2 2h20v20H2z')
    expect(resolveIcon('i-custom:custom-glyph')).toEqual(['M2 2h20v20H2z'])

    const wrapper = mount(Icon, { props: { name: 'custom-glyph' } })
    expect(wrapper.get('path').attributes('d')).toBe('M2 2h20v20H2z')
    wrapper.unmount()
  })

  it('applies size, color and stroke width', () => {
    const wrapper = mount(Icon, {
      props: { name: 'check', size: 24, color: 'rgb(1, 2, 3)', strokeWidth: 3 },
    })

    expect(wrapper.attributes('width')).toBe('24px')
    expect(wrapper.attributes('height')).toBe('24px')
    expect(wrapper.attributes('stroke-width')).toBe('3')
    expect((wrapper.element as SVGElement).style.color).toBe('rgb(1, 2, 3)')
    wrapper.unmount()
  })

  it('is hidden from assistive technology unless labelled', async () => {
    const wrapper = mount(Icon, { props: { name: 'check' } })

    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()

    await wrapper.setProps({ label: '完成' })
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('完成')
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    wrapper.unmount()
  })

  it('renders an empty svg for unknown icons', () => {
    const wrapper = mount(Icon, { props: { name: 'not-a-real-icon' } })

    expect(wrapper.findAll('path')).toHaveLength(0)
    wrapper.unmount()
  })

  it('adds the spin class', () => {
    const wrapper = mount(Icon, { props: { name: 'chevron-down', spin: true } })

    expect(wrapper.classes()).toContain('w-icon--spin')
    wrapper.unmount()
  })
})
