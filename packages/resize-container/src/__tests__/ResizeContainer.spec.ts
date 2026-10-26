import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { defineComponent, h, nextTick, reactive } from 'vue'
import ResizeContainer from '../ResizeContainer.vue'

let callback: ResizeObserverCallback | undefined
let instance: MockResizeObserver | undefined

class MockResizeObserver {
  disconnect = vi.fn()
  observe = vi.fn()
  unobserve = vi.fn()

  constructor(cb: ResizeObserverCallback) {
    callback = cb
    // oxlint-disable-next-line typescript/no-this-alias
    instance = this
  }
}

function createEntry(overrides: Partial<ResizeObserverEntry> = {}) {
  return {
    contentRect: new DOMRectReadOnly(0, 0, 100, 50),
    borderBoxSize: [{ inlineSize: 120, blockSize: 70 }],
    contentBoxSize: [{ inlineSize: 100, blockSize: 50 }],
    devicePixelContentBoxSize: [{ inlineSize: 240, blockSize: 140 }],
    ...overrides,
  } as unknown as ResizeObserverEntry
}

beforeEach(() => {
  callback = undefined
  instance = undefined
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ResizeContainer', () => {
  it('reports dimensions for the configured box', async () => {
    const wrapper = mount(ResizeContainer, {
      props: { box: 'border-box', immediate: false },
      slots: { default: '<div>content</div>' },
    })

    callback?.([createEntry()], instance as unknown as ResizeObserver)
    await wrapper.vm.$nextTick()

    const event = wrapper.emitted('resize')?.[0]?.[0] as
      | { width: number; height: number }
      | undefined
    expect(event?.width).toBe(120)
    expect(event?.height).toBe(70)
    expect(instance?.observe).toHaveBeenCalledWith(wrapper.element, { box: 'border-box' })
    wrapper.unmount()
  })

  it('reports content-box dimensions by default', async () => {
    const wrapper = mount(ResizeContainer, {
      props: { immediate: false },
    })

    callback?.([createEntry()], instance as unknown as ResizeObserver)
    await wrapper.vm.$nextTick()

    const event = wrapper.emitted('resize')?.[0]?.[0] as
      | { width: number; height: number }
      | undefined
    expect(event?.width).toBe(100)
    expect(event?.height).toBe(50)
    wrapper.unmount()
  })

  it('disconnects the observer on unmount', () => {
    const wrapper = mount(ResizeContainer)
    wrapper.unmount()
    expect(instance?.disconnect).toHaveBeenCalled()
  })

  it('preserves runtime inline styles across re-renders and applies declared style changes', async () => {
    const style = reactive<Record<string, string>>({
      width: '200px',
      height: '100px',
      resize: 'both',
      overflow: 'auto',
    })

    const Host = defineComponent({
      setup() {
        return () => h(ResizeContainer, { style, immediate: false })
      },
    })

    const wrapper = mount(Host)
    await nextTick()
    const element = wrapper.get('.w-resize-container').element as HTMLElement
    expect(element.style.width).toBe('200px')

    // Simulate the browser writing new inline dimensions while the user drags
    // the native resize handle.
    element.style.width = '320px'
    element.style.height = '180px'

    callback?.(
      [createEntry({ contentRect: new DOMRectReadOnly(0, 0, 320, 180) })],
      instance as unknown as ResizeObserver,
    )
    await nextTick()

    expect(wrapper.findComponent(ResizeContainer).emitted('resize')).toHaveLength(1)
    expect(element.style.width).toBe('320px')
    expect(element.style.height).toBe('180px')

    // Explicit parent style updates still apply, without touching declarations
    // that did not change.
    style.width = '260px'
    await nextTick()

    expect(element.style.width).toBe('260px')
    expect(element.style.height).toBe('180px')

    wrapper.unmount()
  })

  it('normalizes vendor-prefixed style keys', async () => {
    const wrapper = mount(ResizeContainer, {
      props: { immediate: false },
      attrs: { style: { WebkitTransform: 'translateX(2px)' } },
    })
    await nextTick()

    const element = wrapper.element as HTMLElement
    expect(element.style.getPropertyValue('-webkit-transform')).toBe('translateX(2px)')
    wrapper.unmount()
  })

  it('renders a div root element', () => {
    const wrapper = mount(ResizeContainer, { props: { immediate: false } })

    expect(wrapper.element.tagName).toBe('DIV')
    expect(instance?.observe).toHaveBeenCalledWith(wrapper.element, { box: 'content-box' })
    wrapper.unmount()
  })

  it('measure() always reports even when the size did not change', async () => {
    const wrapper = mount(ResizeContainer, { props: { immediate: false } })

    callback?.([createEntry()], instance as unknown as ResizeObserver)
    await nextTick()
    expect(wrapper.emitted('resize')).toHaveLength(1)

    // Observer callbacks keep deduplicating identical sizes.
    callback?.([createEntry()], instance as unknown as ResizeObserver)
    await nextTick()
    expect(wrapper.emitted('resize')).toHaveLength(1)

    const vm = wrapper.vm as unknown as { measure: () => void }
    vm.measure()
    await nextTick()
    expect(wrapper.emitted('resize')).toHaveLength(2)

    // A manual measurement is explicit: it must report again.
    vm.measure()
    await nextTick()
    expect(wrapper.emitted('resize')).toHaveLength(3)

    wrapper.unmount()
  })
})
