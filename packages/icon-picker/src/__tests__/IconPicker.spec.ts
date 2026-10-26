import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { describe, expect, it } from 'vite-plus/test'
import IconPicker from '../IconPicker.vue'
import type { IconPickerGroup } from '../types'

function makeGroup(key: string, label: string, count: number): IconPickerGroup {
  return {
    key,
    label,
    items: Array.from({ length: count }, (_, index) => ({
      key: `${key}-${index}`,
      label: `${label} ${index}`,
      icon: `demo-icon demo-icon--${key}`,
    })),
  }
}

const groups: IconPickerGroup[] = [
  makeGroup('arrow', '箭头', 120),
  makeGroup('file', '文件', 8),
  {
    key: 'node',
    label: '虚拟节点',
    items: [
      {
        key: 'node-star',
        label: 'Star Node',
        icon: h('svg', { class: 'vnode-icon', viewBox: '0 0 24 24' }, [
          h('path', { d: 'M12 3v18M3 12h18' }),
        ]),
      },
    ],
  },
]

function mountPicker(props: Record<string, unknown> = {}, options: Record<string, unknown> = {}) {
  return mount(IconPicker, {
    props: { items: groups, ...props },
    ...options,
  })
}

describe('IconPicker', () => {
  it('renders grouped sidebar entries and the grouped counts', () => {
    const wrapper = mountPicker()

    const groupContainer = wrapper.get('.w-icon-picker__groups')
    const groupButtons = groupContainer.findAll('.w-icon-picker__group')
    expect(groupButtons).toHaveLength(4)
    expect(groupButtons.map((button) => button.text())).toEqual([
      '全部图标129',
      '箭头120',
      '文件8',
      '虚拟节点1',
    ])
    expect(wrapper.text()).toContain('图标库')
    expect(wrapper.text()).toContain('按用途浏览')
    expect(wrapper.find('.w-icon-picker__search input').exists()).toBe(true)
    expect(groupButtons[0]?.attributes('aria-pressed')).toBe('true')
    expect(groupButtons[1]?.attributes('aria-pressed')).toBe('false')

    wrapper.unmount()
  })

  it('hides the search field when showSearch is false', () => {
    const wrapper = mountPicker({ showSearch: false })

    expect(wrapper.find('.w-icon-picker__search').exists()).toBe(false)

    wrapper.unmount()
  })

  it('filters icons by label', async () => {
    const wrapper = mountPicker()
    await wrapper.get('.w-icon-picker__search input').setValue('文件 3')

    const labels = wrapper.findAll('.w-icon-picker__item').map((item) => item.attributes('title'))
    expect(labels).toContain('文件 3')
    expect(labels.every((label) => label?.includes('文件 3'))).toBe(true)

    wrapper.unmount()
  })

  it('scopes filtering to the active group', async () => {
    const wrapper = mountPicker()

    const fileGroup = wrapper
      .findAll('.w-icon-picker__group')
      .find((button) => button.text().startsWith('文件'))
    await fileGroup!.trigger('click')

    expect(wrapper.get('.w-icon-picker__head-title').text()).toBe('文件')
    expect(wrapper.get('.w-icon-picker__head-count').text()).toBe('8 个')
    expect(fileGroup!.attributes('aria-pressed')).toBe('true')

    wrapper.unmount()
  })

  it('emits selection and v-model updates', async () => {
    const wrapper = mountPicker({ modelValue: null })

    await wrapper.get('.w-icon-picker__item').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['arrow-0'])
    const select = wrapper.emitted('select')?.[0]
    expect(select?.[0]).toMatchObject({ key: 'arrow-0', label: '箭头 0' })
    expect(select?.[1]).toMatchObject({ key: 'arrow' })

    await wrapper.setProps({ modelValue: 'arrow-0' })
    expect(wrapper.get('.w-icon-picker__item').classes()).toContain('is-selected')
    expect(wrapper.find('.w-icon-picker__clear').exists()).toBe(false)

    wrapper.unmount()
  })

  it('renders the empty state and hides empty groups', () => {
    const wrapper = mountPicker({
      items: [{ key: 'empty', label: '空分组', items: [] }],
    })

    expect(wrapper.findAll('.w-icon-picker__group')).toHaveLength(1)
    expect(wrapper.get('.w-icon-picker__empty').text()).toBe('没有匹配的图标')
    expect(wrapper.text()).not.toContain('空分组')

    wrapper.unmount()
  })

  it('moves focus with arrow keys using a roving tabindex', async () => {
    const wrapper = mountPicker({ columns: 3 }, { attachTo: document.body })

    const items = wrapper.findAll('.w-icon-picker__item')
    expect(items[0]?.attributes('tabindex')).toBe('0')
    expect(items[1]?.attributes('tabindex')).toBe('-1')

    await items[0]?.trigger('focus')
    await items[0]?.trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect((document.activeElement as HTMLElement | null)?.getAttribute('title')).toBe('箭头 1')

    wrapper.unmount()
  })

  it('virtualizes a long list instead of rendering every item', () => {
    const wrapper = mountPicker()

    const rendered = wrapper.findAll('.w-icon-picker__item').length
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(129)

    wrapper.unmount()
  })

  it('renders class-name and VNode icons', () => {
    const wrapper = mountPicker()

    const classIcon = wrapper.find('.w-icon-picker__item .demo-icon')
    expect(classIcon.exists()).toBe(true)

    const nodeGroup = wrapper
      .findAll('.w-icon-picker__group')
      .find((button) => button.text().startsWith('虚拟节点'))
    expect(nodeGroup).toBeTruthy()

    wrapper.unmount()
  })

  it('renders a VNode icon when it is in the visible range', async () => {
    const wrapper = mountPicker({ items: [groups[2]!] })

    expect(wrapper.find('.w-icon-picker__item .vnode-icon').exists()).toBe(true)
    expect(wrapper.get('.w-icon-picker__item .vnode-icon').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('.w-icon-picker__item').attributes('title')).toBe('Star Node')

    wrapper.unmount()
  })

  it('renders a custom empty slot', async () => {
    const wrapper = mountPicker(
      {},
      {
        slots: {
          empty: () => h('span', { class: 'custom-empty' }, 'Nothing here'),
        },
      },
    )

    await wrapper.get('.w-icon-picker__search input').setValue('no-such-icon')
    expect(wrapper.get('.custom-empty').text()).toBe('Nothing here')

    wrapper.unmount()
  })
})
