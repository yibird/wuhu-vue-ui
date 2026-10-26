import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import Scrollbar from '../Scrollbar.vue'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Scrollbar', () => {
  it('renders content with default structure', () => {
    const wrapper = mount(Scrollbar, {
      slots: { default: '<div class="content">Content</div>' },
    })

    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.find('.w-scrollbar__wrap').exists()).toBe(true)
    expect(wrapper.find('.w-scrollbar__view').exists()).toBe(true)
    wrapper.unmount()
  })

  it('applies height and max-height to the wrap element', () => {
    const wrapper = mount(Scrollbar, {
      props: { height: 200, maxHeight: '300px' },
    })

    const wrap = wrapper.get('.w-scrollbar__wrap').element as HTMLElement
    expect(wrap.style.height).toBe('200px')
    expect(wrap.style.maxHeight).toBe('300px')
    wrapper.unmount()
  })

  it('uses tag for the view and forwards the id', () => {
    const wrapper = mount(Scrollbar, {
      props: {
        tag: 'section',
        id: 'scroller',
      },
    })

    const view = wrapper.get('.w-scrollbar__view')
    expect(view.element.tagName).toBe('SECTION')
    expect(view.attributes('id')).toBe('scroller')
    wrapper.unmount()
  })

  it('applies semantic classes and styles to wrapper, view and both thumbs', () => {
    const wrapper = mount(Scrollbar, {
      props: {
        classes: {
          wrap: 'custom-wrap',
          view: ['custom-view', { active: true }],
          thumb: 'custom-thumb',
        },
        styles: {
          wrap: { padding: '4px' },
          view: { color: 'red' },
          thumb: { borderRadius: '2px' },
        },
      },
    })

    const wrap = wrapper.get('.w-scrollbar__wrap')
    const view = wrapper.get('.w-scrollbar__view')
    const horizontalThumb = wrapper.get('.w-scrollbar__bar.is-horizontal .w-scrollbar__thumb')
    const verticalThumb = wrapper.get('.w-scrollbar__bar.is-vertical .w-scrollbar__thumb')

    expect(wrap.classes()).toContain('custom-wrap')
    expect(view.classes()).toContain('custom-view')
    expect(view.classes()).toContain('active')
    expect(horizontalThumb.classes()).toContain('custom-thumb')
    expect(verticalThumb.classes()).toContain('custom-thumb')

    expect((wrap.element as HTMLElement).style.padding).toBe('4px')
    expect((view.element as HTMLElement).style.color).toBe('red')
    expect((horizontalThumb.element as HTMLElement).style.borderRadius).toBe('2px')
    expect((verticalThumb.element as HTMLElement).style.borderRadius).toBe('2px')
    wrapper.unmount()
  })

  it('does not render custom bars when native is enabled', () => {
    const wrapper = mount(Scrollbar, { props: { native: true } })

    expect(wrapper.find('.w-scrollbar__bar').exists()).toBe(false)
    expect(wrapper.find('.w-scrollbar__wrap--hidden-default').exists()).toBe(false)
    wrapper.unmount()
  })

  it('does not create a ResizeObserver when native is enabled', () => {
    const created = vi.fn()
    class MockResizeObserver {
      constructor() {
        created()
      }

      observe = vi.fn()
      disconnect = vi.fn()
    }
    vi.stubGlobal('ResizeObserver', MockResizeObserver)

    const wrapper = mount(Scrollbar, { props: { native: true } })

    expect(created).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('marks both custom bars as decorative', () => {
    const wrapper = mount(Scrollbar)

    expect(wrapper.get('.w-scrollbar__bar.is-horizontal').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('.w-scrollbar__bar.is-vertical').attributes('aria-hidden')).toBe('true')
    wrapper.unmount()
  })

  it('emits scroll events with the scroll position', async () => {
    const wrapper = mount(Scrollbar)

    await wrapper.get('.w-scrollbar__wrap').trigger('scroll')

    expect(wrapper.emitted('scroll')).toEqual([[{ scrollTop: 0, scrollLeft: 0 }]])
    wrapper.unmount()
  })

  it('emits end once the scroll position reaches the edge', async () => {
    const wrapper = mount(Scrollbar, { props: { distance: 10 } })
    const wrap = wrapper.get('.w-scrollbar__wrap').element as HTMLElement

    Object.defineProperty(wrap, 'clientHeight', { configurable: true, value: 100 })
    Object.defineProperty(wrap, 'scrollHeight', { configurable: true, value: 400 })
    Object.defineProperty(wrap, 'scrollTop', {
      configurable: true,
      writable: true,
      value: 300,
    })

    await wrapper.get('.w-scrollbar__wrap').trigger('scroll')

    expect(wrapper.emitted('end')).toEqual([['bottom']])
    wrapper.unmount()
  })

  it('calculates the thumb size from the scroll dimensions', async () => {
    const wrapper = mount(Scrollbar, { props: { height: 100 } })
    const wrap = wrapper.get('.w-scrollbar__wrap').element as HTMLElement

    Object.defineProperty(wrap, 'offsetHeight', { configurable: true, value: 100 })
    Object.defineProperty(wrap, 'offsetWidth', { configurable: true, value: 100 })
    Object.defineProperty(wrap, 'scrollHeight', { configurable: true, value: 400 })
    Object.defineProperty(wrap, 'scrollWidth', { configurable: true, value: 400 })

    ;(wrapper.vm as unknown as { update: () => void }).update()
    await wrapper.vm.$nextTick()

    const verticalThumb = wrapper.get('.w-scrollbar__bar.is-vertical .w-scrollbar__thumb')
      .element as HTMLElement
    const horizontalThumb = wrapper.get('.w-scrollbar__bar.is-horizontal .w-scrollbar__thumb')
      .element as HTMLElement

    expect(Number.parseFloat(verticalThumb.style.height)).toBeGreaterThan(0)
    expect(Number.parseFloat(horizontalThumb.style.width)).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('shows custom bars on hover and hides them after leaving', async () => {
    const wrapper = mount(Scrollbar, { props: { height: 100 } })
    const wrap = wrapper.get('.w-scrollbar__wrap').element as HTMLElement

    Object.defineProperty(wrap, 'offsetHeight', { configurable: true, value: 100 })
    Object.defineProperty(wrap, 'offsetWidth', { configurable: true, value: 100 })
    Object.defineProperty(wrap, 'scrollHeight', { configurable: true, value: 400 })
    Object.defineProperty(wrap, 'scrollWidth', { configurable: true, value: 400 })

    ;(wrapper.vm as unknown as { update: () => void }).update()
    await wrapper.vm.$nextTick()

    const verticalThumb = wrapper.get('.w-scrollbar__bar.is-vertical .w-scrollbar__thumb')
    const isDisplayed = () => !verticalThumb.attributes('style')?.includes('display: none')
    expect(isDisplayed()).toBe(false)

    await wrapper.trigger('mouseenter')
    expect(isDisplayed()).toBe(true)

    await wrapper.trigger('mouseleave')
    expect(isDisplayed()).toBe(false)
    wrapper.unmount()
  })

  it('keeps custom bars visible with always', async () => {
    const wrapper = mount(Scrollbar, { props: { height: 100, always: true } })
    const wrap = wrapper.get('.w-scrollbar__wrap').element as HTMLElement

    Object.defineProperty(wrap, 'offsetHeight', { configurable: true, value: 100 })
    Object.defineProperty(wrap, 'offsetWidth', { configurable: true, value: 100 })
    Object.defineProperty(wrap, 'scrollHeight', { configurable: true, value: 400 })
    Object.defineProperty(wrap, 'scrollWidth', { configurable: true, value: 400 })

    ;(wrapper.vm as unknown as { update: () => void }).update()
    await wrapper.vm.$nextTick()

    const verticalThumb = wrapper.get('.w-scrollbar__bar.is-vertical .w-scrollbar__thumb')
    const isDisplayed = () => !verticalThumb.attributes('style')?.includes('display: none')
    expect(isDisplayed()).toBe(true)

    await wrapper.trigger('mouseenter')
    await wrapper.trigger('mouseleave')
    expect(isDisplayed()).toBe(true)
    wrapper.unmount()
  })

  it('ends an active drag when the window loses focus', async () => {
    const wrapper = mount(Scrollbar)

    await wrapper.get('.w-scrollbar__bar.is-vertical .w-scrollbar__thumb').trigger('mousedown')
    expect(wrapper.get('.w-scrollbar__bar.is-vertical .w-scrollbar__thumb').classes()).toContain(
      'is-dragging',
    )

    window.dispatchEvent(new Event('blur'))
    await wrapper.vm.$nextTick()

    expect(
      wrapper.get('.w-scrollbar__bar.is-vertical .w-scrollbar__thumb').classes(),
    ).not.toContain('is-dragging')
    wrapper.unmount()
  })

  it('exposes scroll helpers', () => {
    const wrapper = mount(Scrollbar)
    const vm = wrapper.vm as unknown as {
      setScrollTop: (value: number) => void
      setScrollLeft: (value: number) => void
      wrapRef: HTMLElement
    }

    vm.setScrollTop(50)
    vm.setScrollLeft(20)

    expect(vm.wrapRef.scrollTop).toBe(50)
    expect(vm.wrapRef.scrollLeft).toBe(20)
    wrapper.unmount()
  })
})
