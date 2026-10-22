import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { nextTick } from 'vue'
import LazyContainer from '../LazyContainer.vue'

let callback: IntersectionObserverCallback | undefined
let observerInstance: MockIntersectionObserver | undefined

class MockIntersectionObserver {
  disconnect = vi.fn()
  observe = vi.fn()
  unobserve = vi.fn()

  constructor(cb: IntersectionObserverCallback) {
    callback = cb
    // oxlint-disable-next-line typescript/no-this-alias
    observerInstance = this
  }

  trigger(isIntersecting: boolean) {
    const entry = { isIntersecting } as IntersectionObserverEntry
    callback?.([entry], this as unknown as IntersectionObserver)
  }
}

beforeEach(() => {
  callback = undefined
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LazyContainer', () => {
  it('lazily renders content on intersection and emits enter / leave', async () => {
    const wrapper = mount(LazyContainer, {
      slots: {
        default: '<div class="loaded">Loaded content</div>',
        placeholder: '<div class="placeholder">Placeholder</div>',
      },
    })

    expect(wrapper.find('.placeholder').exists()).toBe(true)
    expect(wrapper.find('.loaded').exists()).toBe(false)

    observerInstance!.trigger(true)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.loaded').exists()).toBe(true)
    expect(wrapper.find('.placeholder').exists()).toBe(false)
    expect(wrapper.emitted('enter')).toHaveLength(1)

    observerInstance!.trigger(false)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.loaded').exists()).toBe(true)
    expect(wrapper.emitted('leave')).toHaveLength(1)
    wrapper.unmount()
  })

  it('emits enter only on visibility transitions', async () => {
    const wrapper = mount(LazyContainer, {
      slots: { default: '<div class="loaded">Loaded</div>' },
    })

    observerInstance!.trigger(true)
    observerInstance!.trigger(true)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('enter')).toHaveLength(1)

    observerInstance!.trigger(false)
    observerInstance!.trigger(false)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('leave')).toHaveLength(1)
    wrapper.unmount()
  })

  it('disconnects after the first intersection when once is true', async () => {
    const wrapper = mount(LazyContainer, {
      props: { once: true },
      slots: { default: '<div class="loaded">Loaded</div>' },
    })

    observerInstance!.trigger(true)
    await wrapper.vm.$nextTick()

    expect(observerInstance!.disconnect).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('renders immediately when IntersectionObserver is unavailable', async () => {
    vi.stubGlobal('IntersectionObserver', undefined)

    const wrapper = mount(LazyContainer, {
      slots: { default: '<div class="loaded">Loaded</div>' },
    })
    await nextTick()

    expect(wrapper.find('.loaded').exists()).toBe(true)
    wrapper.unmount()
  })

  it('re-observes the new root element when tag changes', async () => {
    const wrapper = mount(LazyContainer, {
      props: { tag: 'div' },
      slots: { default: '<div class="loaded">Loaded</div>' },
    })
    const firstObserver = observerInstance
    const firstElement = wrapper.element

    await wrapper.setProps({ tag: 'section' })
    await nextTick()

    expect(wrapper.element.tagName).toBe('SECTION')
    expect(wrapper.element).not.toBe(firstElement)
    expect(firstObserver?.disconnect).toHaveBeenCalled()
    expect(observerInstance).not.toBe(firstObserver)
    expect(observerInstance?.observe).toHaveBeenCalledWith(wrapper.element)

    observerInstance!.trigger(true)
    await nextTick()

    expect(wrapper.find('.loaded').exists()).toBe(true)
    expect(wrapper.emitted('enter')).toHaveLength(1)

    wrapper.unmount()
  })
})
