import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'
import { h } from 'vue'
import { View, ViewContent, ViewFooter, ViewHeader, ViewSider } from '../../index'

describe('View', () => {
  it('renders a full-size flex root with gap', () => {
    const wrapper = mount(View, {
      props: { gap: 12, direction: 'horizontal' },
      slots: { default: () => h('span', { class: 'content' }, 'content') },
    })

    const root = wrapper.element as HTMLElement
    expect(root.className).toContain('w-view')
    expect(root.className).toContain('w-view-full')
    expect(root.style.display).toBe('flex')
    expect(root.style.flexDirection).toBe('row')
    expect(root.style.gap).toBe('12px')
    expect(wrapper.get('.content').text()).toBe('content')
    wrapper.unmount()
  })

  it('can disable full-size mode', () => {
    const wrapper = mount(View, {
      props: { full: false },
    })

    expect((wrapper.element as HTMLElement).className).not.toContain('w-view-full')
    wrapper.unmount()
  })

  it('exposes compound subcomponents', () => {
    expect(View.Header).toBe(ViewHeader)
    expect(View.Content).toBe(ViewContent)
    expect(View.Sider).toBe(ViewSider)
    expect(View.Footer).toBe(ViewFooter)
  })

  it('renders content and footer slots', () => {
    const wrapper = mount({
      components: { View, ViewContent, ViewFooter },
      template: `
        <View>
          <ViewContent><span class="body">Body</span></ViewContent>
          <ViewFooter><span class="foot">Footer</span></ViewFooter>
        </View>
      `,
    })

    expect(wrapper.get('.w-view-content').find('.body').text()).toBe('Body')
    expect(wrapper.get('.w-view-footer').find('.foot').text()).toBe('Footer')
    wrapper.unmount()
  })

  it('collapses the header and emits state updates', async () => {
    const wrapper = mount(ViewHeader, {
      props: { collapsible: true },
      slots: { default: () => h('span', 'Header') },
    })

    const header = wrapper.element as HTMLElement
    const trigger = wrapper.get('.w-view-header__trigger-button')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.w-view-header__trigger .w-icon').exists()).toBe(true)

    await trigger.trigger('click')

    expect(wrapper.emitted('collapse')?.[0]).toEqual([true])
    expect(wrapper.emitted('update:collapsed')?.[0]).toEqual([true])
    expect(header.className).toContain('w-view-header-collapsed')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('supports a custom header trigger slot', () => {
    const wrapper = mount(ViewHeader, {
      props: { collapsible: true },
      slots: {
        trigger: () => h('button', { 'data-custom-trigger': '' }, 'toggle'),
      },
    })

    const custom = wrapper.find('[data-custom-trigger]')
    expect(custom.exists()).toBe(true)
    expect(wrapper.find('.w-view-header__trigger-button').exists()).toBe(false)
    wrapper.unmount()
  })

  it('collapses the sider and applies width styles', async () => {
    const wrapper = mount(ViewSider, {
      props: {
        collapsible: true,
        width: 260,
        collapsedWidth: 48,
      },
      slots: { default: () => h('span', 'Sider') },
    })

    const sider = wrapper.element as HTMLElement
    expect(sider.style.width).toBe('260px')
    expect(sider.style.flexBasis).toBe('260px')

    await wrapper.get('.w-view-sider__trigger-button').trigger('click')

    expect(wrapper.emitted('collapse')?.[0]).toEqual([true])
    expect(sider.style.width).toBe('48px')
    expect(sider.className).toContain('w-view-sider-collapsed')
    wrapper.unmount()
  })

  it('forwards class/style to the header root', () => {
    const wrapper = mount(ViewHeader, {
      attrs: {
        class: 'consumer-header',
        style: 'color: rgb(1, 2, 3)',
        'data-consumer': 'yes',
      },
    })

    const root = wrapper.element as HTMLElement
    expect(root.classList.contains('consumer-header')).toBe(true)
    expect(root.style.color).toBe('rgb(1, 2, 3)')
    expect(root.dataset.consumer).toBe('yes')
    expect(wrapper.get('.w-view-header__content').classes()).not.toContain('consumer-header')
    wrapper.unmount()
  })

  it('forwards class/style to the sider root', () => {
    const wrapper = mount(ViewSider, {
      attrs: {
        class: 'consumer-sider',
        style: 'color: rgb(1, 2, 3)',
        'data-consumer': 'yes',
      },
    })

    const root = wrapper.element as HTMLElement
    expect(root.classList.contains('consumer-sider')).toBe(true)
    expect(root.style.color).toBe('rgb(1, 2, 3)')
    expect(root.dataset.consumer).toBe('yes')
    expect(wrapper.get('.w-view-sider__body').classes()).not.toContain('consumer-sider')
    wrapper.unmount()
  })
})
