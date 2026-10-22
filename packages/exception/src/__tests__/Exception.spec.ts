import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it } from 'vite-plus/test'
import Exception from '../Exception.vue'

describe('Exception', () => {
  it('renders the notFound preset by default', () => {
    const wrapper = mount(Exception)

    expect(wrapper.classes()).toContain('w-exception')
    expect(wrapper.classes()).toContain('w-exception--notFound')
    expect(wrapper.find('.w-exception__code').exists()).toBe(false)
    expect(wrapper.get('.w-exception__title').text()).toBe('页面不存在')
    expect(wrapper.get('.w-exception__description').text()).toContain('页面不存在或已被移除')
    expect(wrapper.find('.w-exception-illustration').exists()).toBe(true)
    wrapper.unmount()
  })

  it.each([
    ['badRequest', '请求错误'],
    ['forbidden', '无访问权限'],
    ['serverError', '服务端错误'],
    ['networkError', '网络异常'],
  ] as const)('renders the %s preset', (type, title) => {
    const wrapper = mount(Exception, { props: { type } })

    expect(wrapper.classes()).toContain(`w-exception--${type}`)
    expect(wrapper.get('.w-exception__title').text()).toBe(title)
    wrapper.unmount()
  })

  it('allows title and description overrides', () => {
    const wrapper = mount(Exception, {
      props: {
        type: 'serverError',
        title: '保存失败',
        description: '请稍后重试或联系管理员。',
      },
    })

    expect(wrapper.get('.w-exception__title').text()).toBe('保存失败')
    expect(wrapper.get('.w-exception__description').text()).toBe('请稍后重试或联系管理员。')
    wrapper.unmount()
  })

  it('renders a custom image instead of the built-in illustration', () => {
    const wrapper = mount(Exception, {
      props: {
        type: 'forbidden',
        image: '/error-banner.png',
        imageAlt: '无权限插图',
        imageWidth: 280,
      },
    })

    const image = wrapper.get('.w-exception__image')
    expect(image.attributes('src')).toBe('/error-banner.png')
    expect(image.attributes('alt')).toBe('无权限插图')
    expect(wrapper.find('.w-exception-illustration').exists()).toBe(false)
    expect(wrapper.get('.w-exception__media').attributes('style')).toContain(
      '--w-exception-image-width: 280px',
    )
    wrapper.unmount()
  })

  it('can hide the image area', () => {
    const wrapper = mount(Exception, { props: { showImage: false } })

    expect(wrapper.find('.w-exception__media').exists()).toBe(false)
    expect(wrapper.find('.w-exception__content').exists()).toBe(true)
    wrapper.unmount()
  })

  it('exposes image, title, description and default slots', () => {
    const wrapper = mount(Exception, {
      props: { type: 'notFound' },
      slots: {
        image: () => h('div', { class: 'custom-image' }, '插图'),
        title: ({ type, title }: { type: string; title: string }) =>
          h('span', { class: 'custom-title' }, `${type} · ${title}`),
        description: ({ description }: { description: string }) =>
          h('span', { class: 'custom-description' }, description),
        default: ({ type }: { type: string }) =>
          h('button', { class: 'action' }, `返回首页 ${type}`),
      },
    })

    expect(wrapper.get('.custom-image').text()).toBe('插图')
    expect(wrapper.get('.custom-title').text()).toBe('notFound · 页面不存在')
    expect(wrapper.get('.custom-description').text()).toContain('页面不存在')
    expect(wrapper.get('.action').text()).toBe('返回首页 notFound')
    wrapper.unmount()
  })

  it('supports semantic classes and styles for every part', () => {
    const wrapper = mount(Exception, {
      props: {
        type: 'serverError',
        classes: {
          root: 'custom-root',
          media: 'custom-media',
          illustration: 'custom-illustration',
          content: 'custom-content',
          title: 'custom-title',
          description: 'custom-description',
          extra: 'custom-extra',
        },
        styles: {
          root: { backgroundColor: 'rgb(1, 2, 3)' },
          media: { opacity: '0.9' },
          title: { color: 'rgb(4, 5, 6)' },
        },
      },
      slots: { default: () => h('span', 'extra') },
    })

    expect(wrapper.classes()).toContain('custom-root')
    expect(wrapper.attributes('style')).toContain('background-color: rgb(1, 2, 3)')
    expect(wrapper.get('.w-exception__media').classes()).toContain('custom-media')
    expect(wrapper.get('.w-exception__media').attributes('style')).toContain('opacity: 0.9')
    expect(wrapper.get('.w-exception__illustration').classes()).toContain('custom-illustration')
    expect(wrapper.get('.w-exception__content').classes()).toContain('custom-content')
    expect(wrapper.get('.w-exception__title').classes()).toContain('custom-title')
    expect(wrapper.get('.w-exception__title').attributes('style')).toContain('color: rgb(4, 5, 6)')
    expect(wrapper.get('.w-exception__description').classes()).toContain('custom-description')
    expect(wrapper.get('.w-exception__extra').classes()).toContain('custom-extra')
    wrapper.unmount()
  })

  it('labels the section with the rendered title', () => {
    const wrapper = mount(Exception, { props: { type: 'badRequest' } })
    const section = wrapper.get('section')
    const heading = wrapper.get('h2')

    expect(section.attributes('aria-labelledby')).toBe(heading.attributes('id'))
    wrapper.unmount()
  })
})
