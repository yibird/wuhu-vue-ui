import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it } from 'vite-plus/test'
import Empty from '../Empty.vue'

describe('Empty', () => {
  it('renders the default title and illustration', () => {
    const wrapper = mount(Empty)

    expect(wrapper.classes()).toContain('w-empty')
    expect(wrapper.classes()).toContain('is-md')
    expect(wrapper.get('.w-empty__title').text()).toBe('暂无数据')
    expect(wrapper.find('.w-empty__illustration').exists()).toBe(true)
    expect(wrapper.find('.w-empty__image').exists()).toBe(false)
    expect(wrapper.find('.w-empty__description').exists()).toBe(false)
    expect(wrapper.find('.w-empty__extra').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders title, description and size props', () => {
    const wrapper = mount(Empty, {
      props: {
        title: '暂无项目',
        description: '创建第一个项目开始使用。',
        size: 'lg',
      },
    })

    expect(wrapper.classes()).toContain('is-lg')
    expect(wrapper.get('.w-empty__title').text()).toBe('暂无项目')
    expect(wrapper.get('.w-empty__description').text()).toBe('创建第一个项目开始使用。')
    wrapper.unmount()
  })

  it('renders a custom image instead of the built-in illustration', () => {
    const wrapper = mount(Empty, {
      props: {
        title: '没有收藏',
        image: '/empty.png',
      },
    })

    const image = wrapper.get('.w-empty__image')
    expect(image.attributes('src')).toBe('/empty.png')
    expect(image.attributes('alt')).toBe('没有收藏')
    expect(wrapper.find('.w-empty__illustration').exists()).toBe(false)
    wrapper.unmount()
  })

  it('falls back to the illustration when the image fails', async () => {
    const wrapper = mount(Empty, { props: { image: '/broken.png' } })

    await wrapper.get('.w-empty__image').trigger('error')

    expect(wrapper.find('.w-empty__image').exists()).toBe(false)
    expect(wrapper.find('.w-empty__illustration').exists()).toBe(true)

    await wrapper.setProps({ image: '/recovered.png' })
    expect(wrapper.get('.w-empty__image').attributes('src')).toBe('/recovered.png')
    wrapper.unmount()
  })

  it('exposes image, title, description and default slots', () => {
    const wrapper = mount(Empty, {
      props: {
        title: '暂无数据',
        description: '还没有内容',
      },
      slots: {
        image: () => h('div', { class: 'custom-image' }, '插图'),
        title: ({ title }: { title: string }) => h('span', { class: 'custom-title' }, title),
        description: ({ title, description }: { title: string; description: string }) =>
          h('span', { class: 'custom-description' }, `${title} · ${description}`),
        default: () => h('button', { class: 'action' }, '新建'),
      },
    })

    expect(wrapper.get('.custom-image').text()).toBe('插图')
    expect(wrapper.find('.w-empty__illustration').exists()).toBe(false)
    expect(wrapper.get('.custom-title').text()).toBe('暂无数据')
    expect(wrapper.get('.custom-description').text()).toBe('暂无数据 · 还没有内容')
    expect(wrapper.get('.w-empty__extra').text()).toBe('新建')
    wrapper.unmount()
  })

  it('supports semantic classes and styles for every part', () => {
    const wrapper = mount(Empty, {
      props: {
        image: '/empty.png',
        description: '暂无描述',
        classes: {
          root: 'custom-root',
          image: 'custom-image',
          title: 'custom-title',
          description: 'custom-description',
          extra: 'custom-extra',
        },
        styles: {
          root: { backgroundColor: 'rgb(1, 2, 3)' },
          image: { opacity: '0.9' },
          title: { color: 'rgb(4, 5, 6)' },
        },
      },
      slots: { default: () => h('span', 'extra') },
    })

    expect(wrapper.classes()).toContain('custom-root')
    expect(wrapper.attributes('style')).toContain('background-color: rgb(1, 2, 3)')
    expect(wrapper.get('.w-empty__image').classes()).toContain('custom-image')
    expect(wrapper.get('.w-empty__image').attributes('style')).toContain('opacity: 0.9')
    expect(wrapper.get('.w-empty__title').classes()).toContain('custom-title')
    expect(wrapper.get('.w-empty__title').attributes('style')).toContain('color: rgb(4, 5, 6)')
    expect(wrapper.get('.w-empty__description').classes()).toContain('custom-description')
    expect(wrapper.get('.w-empty__extra').classes()).toContain('custom-extra')
    wrapper.unmount()
  })
})
