import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'
import { nextTick } from 'vue'
import SlidingHighlight from '../SlidingHighlight.vue'
import type { SlidingHighlightInstance } from '../types'

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect
}

function mockClientOffset(root: HTMLElement, left: number, top: number) {
  Object.defineProperty(root, 'clientLeft', { configurable: true, value: left })
  Object.defineProperty(root, 'clientTop', { configurable: true, value: top })
}

const slots = {
  default:
    '<button id="a" type="button">Overview</button><button id="b" type="button">Components</button>',
}

describe('SlidingHighlight', () => {
  it('renders slot content and tracks pointer hover', async () => {
    const wrapper = mount(SlidingHighlight, {
      props: { inset: 10 },
      slots,
    })
    const root = wrapper.get('.w-sliding-highlight')
    const item = wrapper.get('#b')

    root.element.getBoundingClientRect = () => rect(10, 10, 200, 40)
    item.element.getBoundingClientRect = () => rect(40, 5, 60, 20)

    await item.trigger('pointerover')
    await nextTick()

    const container = wrapper.get('.w-sliding-highlight__container')
    expect(container.attributes('data-w-sliding-highlight-pill')).toBeDefined()
    expect(container.attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('.w-sliding-highlight__pill')).toBeTruthy()

    const style = (container.element as HTMLElement).style
    expect(style.transform).toBe('translate3d(20px, -5px, 0)')
    expect(style.width).toBe('80px')
    expect(style.height).toBe('20px')

    wrapper.unmount()
  })

  it('keeps the highlight while moving between item gaps and clears on leave', async () => {
    const wrapper = mount(SlidingHighlight, { slots })
    const root = wrapper.get('.w-sliding-highlight')
    const item = wrapper.get('#a')

    root.element.getBoundingClientRect = () => rect(0, 0, 200, 40)
    item.element.getBoundingClientRect = () => rect(0, 0, 80, 40)

    await item.trigger('pointerover')
    await nextTick()
    expect(wrapper.find('.w-sliding-highlight__container').exists()).toBe(true)

    await root.trigger('pointerover')
    await nextTick()
    expect(wrapper.find('.w-sliding-highlight__container').exists()).toBe(true)

    await root.trigger('pointerleave')
    await nextTick()
    expect(wrapper.find('.w-sliding-highlight__container').exists()).toBe(false)

    wrapper.unmount()
  })

  it('supports the semantic list tag for the pill', async () => {
    const wrapper = mount(SlidingHighlight, {
      props: { as: 'ul' },
      slots: {
        default: '<li id="a">Overview</li><li id="b">Components</li>',
      },
    })
    const root = wrapper.get('.w-sliding-highlight')
    const item = wrapper.get('#b')

    expect(root.element.tagName).toBe('UL')
    root.element.getBoundingClientRect = () => rect(0, 0, 200, 40)
    item.element.getBoundingClientRect = () => rect(100, 0, 80, 40)

    await item.trigger('pointerover')
    await nextTick()

    expect(wrapper.get('.w-sliding-highlight__container').element.tagName).toBe('LI')

    wrapper.unmount()
  })

  it('applies custom pill classes', async () => {
    const wrapper = mount(SlidingHighlight, {
      props: {
        pillClassName: 'custom-pill',
        pillContainerClassName: 'custom-pill-container',
      },
      slots,
    })
    const root = wrapper.get('.w-sliding-highlight')
    const item = wrapper.get('#a')
    root.element.getBoundingClientRect = () => rect(0, 0, 200, 40)
    item.element.getBoundingClientRect = () => rect(10, 0, 80, 40)

    await item.trigger('pointerover')
    await nextTick()

    expect(wrapper.get('.w-sliding-highlight__container').classes()).toContain(
      'custom-pill-container',
    )
    expect(wrapper.get('.w-sliding-highlight__pill').classes()).toContain('custom-pill')

    wrapper.unmount()
  })

  it('exposes programmatic highlight and clear methods', async () => {
    const wrapper = mount(SlidingHighlight, { slots })
    const instance = wrapper.vm as unknown as SlidingHighlightInstance
    const root = wrapper.get('.w-sliding-highlight')
    const item = wrapper.get('#b')

    root.element.getBoundingClientRect = () => rect(0, 0, 200, 40)
    item.element.getBoundingClientRect = () => rect(100, 0, 80, 40)

    instance.highlight(item.element as HTMLElement)
    await nextTick()
    expect(wrapper.find('.w-sliding-highlight__container').exists()).toBe(true)

    instance.highlight(document.createElement('div'))
    await nextTick()
    expect(wrapper.find('.w-sliding-highlight__container').exists()).toBe(true)

    instance.clear()
    await nextTick()
    expect(wrapper.find('.w-sliding-highlight__container').exists()).toBe(false)

    wrapper.unmount()
  })

  it('includes scroll offsets and border origins in the geometry', async () => {
    const wrapper = mount(SlidingHighlight, {
      props: { inset: 0 },
      slots,
    })
    const root = wrapper.get('.w-sliding-highlight')
    mockClientOffset(root.element as HTMLElement, 2, 3)
    Object.defineProperty(root.element, 'scrollLeft', { configurable: true, value: 12 })
    Object.defineProperty(root.element, 'scrollTop', { configurable: true, value: 7 })
    root.element.getBoundingClientRect = () => rect(100, 100, 200, 40)
    wrapper.get('#a').element.getBoundingClientRect = () => rect(120, 110, 60, 20)

    await wrapper.get('#a').trigger('pointerover')
    await nextTick()

    const style = (wrapper.get('.w-sliding-highlight__container').element as HTMLElement).style
    expect(style.transform).toBe('translate3d(30px, 14px, 0)')
    expect(style.width).toBe('60px')
    expect(style.height).toBe('20px')

    wrapper.unmount()
  })

  it('converts visual coordinates back to local pixels when the root is scaled', async () => {
    const wrapper = mount(SlidingHighlight, {
      props: { inset: 0 },
      slots,
    })
    const root = wrapper.get('.w-sliding-highlight')
    mockClientOffset(root.element as HTMLElement, 1, 1)
    Object.defineProperty(root.element, 'offsetWidth', { configurable: true, value: 200 })
    Object.defineProperty(root.element, 'offsetHeight', { configurable: true, value: 40 })
    root.element.getBoundingClientRect = () => rect(0, 0, 400, 80)
    wrapper.get('#b').element.getBoundingClientRect = () => rect(22, 2, 160, 64)

    await wrapper.get('#b').trigger('pointerover')
    await nextTick()

    const style = (wrapper.get('.w-sliding-highlight__container').element as HTMLElement).style
    expect(style.transform).toBe('translate3d(10px, 0px, 0)')
    expect(style.width).toBe('80px')
    expect(style.height).toBe('32px')

    wrapper.unmount()
  })

  it('re-measures when inset changes', async () => {
    const wrapper = mount(SlidingHighlight, {
      props: { inset: 0 },
      slots,
    })
    const root = wrapper.get('.w-sliding-highlight')
    const item = wrapper.get('#a')
    root.element.getBoundingClientRect = () => rect(0, 0, 200, 40)
    item.element.getBoundingClientRect = () => rect(20, 5, 60, 20)

    await item.trigger('pointerover')
    await nextTick()
    expect(
      (wrapper.get('.w-sliding-highlight__container').element as HTMLElement).style.width,
    ).toBe('60px')

    await wrapper.setProps({ inset: 8 })
    await nextTick()
    const style = (wrapper.get('.w-sliding-highlight__container').element as HTMLElement).style
    expect(style.width).toBe('76px')
    expect(style.transform).toBe('translate3d(12px, 5px, 0)')

    wrapper.unmount()
  })
})
