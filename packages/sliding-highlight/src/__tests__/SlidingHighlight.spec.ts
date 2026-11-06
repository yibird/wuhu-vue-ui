import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
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

const resizeObservers: MockResizeObserver[] = []

class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()

  constructor(callback: ResizeObserverCallback) {
    void callback
    resizeObservers.push(this)
  }
}

afterEach(() => {
  resizeObservers.length = 0
  vi.unstubAllGlobals()
})

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

  it('applies semantic classes and styles to the container and pill', async () => {
    const wrapper = mount(SlidingHighlight, {
      props: {
        classes: {
          container: 'custom-pill-container',
          pill: ['custom-pill', { active: true }],
        },
        styles: {
          container: { opacity: '0.9' },
          pill: { background: 'rgb(1, 2, 3)' },
        },
      },
      slots,
    })
    const root = wrapper.get('.w-sliding-highlight')
    const item = wrapper.get('#a')
    root.element.getBoundingClientRect = () => rect(0, 0, 200, 40)
    item.element.getBoundingClientRect = () => rect(10, 0, 80, 40)

    await item.trigger('pointerover')
    await nextTick()

    const container = wrapper.get('.w-sliding-highlight__container')
    const pill = wrapper.get('.w-sliding-highlight__pill')

    expect(container.classes()).toContain('custom-pill-container')
    expect((container.element as HTMLElement).style.opacity).toBe('0.9')
    expect(pill.classes()).toEqual(expect.arrayContaining(['custom-pill', 'active']))
    expect((pill.element as HTMLElement).style.background).toBe('rgb(1, 2, 3)')

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

  it('clears the highlight when the hovered item is detached', async () => {
    const wrapper = mount(SlidingHighlight, { slots })
    const instance = wrapper.vm as unknown as SlidingHighlightInstance
    const root = wrapper.get('.w-sliding-highlight')
    const item = wrapper.get('#b')

    root.element.getBoundingClientRect = () => rect(0, 0, 200, 40)
    item.element.getBoundingClientRect = () => rect(100, 0, 80, 40)

    instance.highlight(item.element as HTMLElement)
    await nextTick()
    expect(wrapper.find('.w-sliding-highlight__container').exists()).toBe(true)

    item.element.remove()
    await wrapper.setProps({ inset: 8 })
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

  it('observes every item while a highlight is active', async () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    const wrapper = mount(SlidingHighlight, { slots })
    const instance = wrapper.vm as unknown as SlidingHighlightInstance
    const root = wrapper.get('.w-sliding-highlight')
    const a = wrapper.get('#a').element as HTMLElement
    const b = wrapper.get('#b').element as HTMLElement

    root.element.getBoundingClientRect = () => rect(0, 0, 200, 40)
    a.getBoundingClientRect = () => rect(0, 0, 80, 40)
    b.getBoundingClientRect = () => rect(100, 0, 80, 40)

    const observer = resizeObservers[0]!
    expect(observer.observe).toHaveBeenCalledWith(root.element)

    instance.highlight(a)
    await nextTick()
    expect(observer.observe).toHaveBeenCalledWith(a)
    expect(observer.observe).toHaveBeenCalledWith(b)

    instance.clear()
    await nextTick()
    const calls = observer.observe.mock.calls
    expect(calls.at(-1)?.[0]).toBe(root.element)

    wrapper.unmount()
  })

  it('re-measures after the item order changes', async () => {
    const raf = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0)
        return 1
      })

    const wrapper = mount(SlidingHighlight, { props: { inset: 0 }, slots })
    const root = wrapper.get('.w-sliding-highlight')
    const a = wrapper.get('#a')
    const b = wrapper.get('#b').element as HTMLElement

    root.element.getBoundingClientRect = () => rect(0, 0, 200, 40)
    let aLeft = 0
    ;(a.element as HTMLElement).getBoundingClientRect = () => rect(aLeft, 0, 80, 40)
    b.getBoundingClientRect = () => rect(100, 0, 80, 40)

    await a.trigger('pointerover')
    await nextTick()
    const style = (wrapper.get('.w-sliding-highlight__container').element as HTMLElement).style
    expect(style.transform).toBe('translate3d(0px, 0px, 0)')

    // Move the hovered item after its sibling without changing any box size.
    aLeft = 100
    root.element.insertBefore(b, a.element as HTMLElement)
    await nextTick()
    await nextTick()

    expect(style.transform).toBe('translate3d(100px, 0px, 0)')
    raf.mockRestore()
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
