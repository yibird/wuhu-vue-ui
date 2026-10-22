import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { h, nextTick } from 'vue'
import Ellipsis from '../Ellipsis.vue'
import type { EllipsisActionSlotProps } from '../types'

let resizeCallback: ResizeObserverCallback | undefined
let observer: MockResizeObserver | undefined

class MockResizeObserver {
  disconnect = vi.fn()
  observe = vi.fn()
  unobserve = vi.fn()

  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback
    // oxlint-disable-next-line typescript/no-this-alias
    observer = this
  }
}

beforeEach(() => {
  resizeCallback = undefined
  observer = undefined
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const longText = 'Wuhu Vue UI 是一套面向复杂业务场景的 Vue 3 组件库，支持多行文本省略。'

function emitResize() {
  resizeCallback?.([], observer as unknown as ResizeObserver)
}

async function mockOverflow(wrapper: VueWrapper, overflows = true) {
  const content = wrapper.get('.w-ellipsis__content').element as HTMLElement
  Object.defineProperty(content, 'clientHeight', { configurable: true, value: 20 })
  Object.defineProperty(content, 'scrollHeight', { configurable: true, value: overflows ? 80 : 20 })
  emitResize()
  await nextTick()
}

describe('Ellipsis', () => {
  it('renders the text, root tag and default single line style', () => {
    const wrapper = mount(Ellipsis, { props: { text: longText } })

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toContain('w-ellipsis')
    expect(wrapper.get('.w-ellipsis__content').text()).toBe(longText)
    expect(wrapper.get('.w-ellipsis__content').attributes('style')).toContain(
      '--w-ellipsis-lines: 1',
    )
    expect(wrapper.find('.w-ellipsis__action').exists()).toBe(false)
    wrapper.unmount()
  })

  it('supports a custom tag and line count', () => {
    const wrapper = mount(Ellipsis, { props: { text: longText, tag: 'p', lines: 3 } })

    expect(wrapper.element.tagName).toBe('P')
    expect(wrapper.get('.w-ellipsis__content').attributes('style')).toContain(
      '--w-ellipsis-lines: 3',
    )
    wrapper.unmount()
  })

  it('renders the default slot instead of the text prop', () => {
    const wrapper = mount(Ellipsis, {
      props: { text: 'ignored' },
      slots: { default: () => h('span', { class: 'custom' }, '自定义内容') },
    })

    expect(wrapper.get('.custom').text()).toBe('自定义内容')
    expect(wrapper.text()).not.toContain('ignored')
    wrapper.unmount()
  })

  it('detects overflow with ResizeObserver and shows the action', async () => {
    const wrapper = mount(Ellipsis, { props: { text: longText, expandable: true } })

    expect(observer?.observe).toHaveBeenCalledWith(wrapper.get('.w-ellipsis__content').element)
    expect(wrapper.find('.w-ellipsis__action').exists()).toBe(false)

    await mockOverflow(wrapper)

    expect(wrapper.classes()).toContain('is-overflowed')
    expect(wrapper.find('.w-ellipsis__action').exists()).toBe(true)
    expect(wrapper.get('.w-ellipsis__action').attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('does not render the action when the content is not overflowing', async () => {
    const wrapper = mount(Ellipsis, { props: { text: 'short', expandable: true } })

    await mockOverflow(wrapper, false)

    expect(wrapper.find('.w-ellipsis__action').exists()).toBe(false)
    wrapper.unmount()
  })

  it('does not render the action when expandable is false', async () => {
    const wrapper = mount(Ellipsis, { props: { text: longText } })

    await mockOverflow(wrapper)

    expect(wrapper.classes()).toContain('is-overflowed')
    expect(wrapper.find('.w-ellipsis__action').exists()).toBe(false)
    wrapper.unmount()
  })

  it('toggles expansion and emits update/expand/collapse', async () => {
    const wrapper = mount(Ellipsis, { props: { text: longText, expandable: true } })
    await mockOverflow(wrapper)

    await wrapper.get('.w-ellipsis__action').trigger('click')

    expect(wrapper.emitted('update:expanded')?.[0]).toEqual([true])
    expect(wrapper.emitted('expand')).toHaveLength(1)
    expect(wrapper.classes()).toContain('is-expanded')
    expect(wrapper.get('.w-ellipsis__content').classes()).toContain('is-expanded')
    expect(wrapper.get('.w-ellipsis__action').attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('.w-ellipsis__action').text()).toBe('收起')

    await wrapper.get('.w-ellipsis__action').trigger('click')

    expect(wrapper.emitted('update:expanded')?.[1]).toEqual([false])
    expect(wrapper.emitted('collapse')).toHaveLength(1)
    expect(wrapper.classes()).not.toContain('is-expanded')
    wrapper.unmount()
  })

  it('follows the controlled expanded prop', async () => {
    const wrapper = mount(Ellipsis, {
      props: { text: longText, expandable: true, expanded: true },
    })

    expect(wrapper.classes()).toContain('is-expanded')
    expect(wrapper.get('.w-ellipsis__content').classes()).toContain('is-expanded')

    await wrapper.setProps({ expanded: false })

    expect(wrapper.classes()).not.toContain('is-expanded')
    expect(wrapper.get('.w-ellipsis__content').classes()).not.toContain('is-expanded')
    wrapper.unmount()
  })

  it('exposes action slot props and keeps the built-in click behavior', async () => {
    const actionSlot = vi.fn((slotProps: EllipsisActionSlotProps) =>
      h('span', { class: 'custom-action' }, slotProps.expanded ? '收' : '展'),
    )
    const wrapper = mount(Ellipsis, {
      props: { text: longText, expandable: true },
      slots: { action: actionSlot },
    })
    await mockOverflow(wrapper)

    expect(actionSlot).toHaveBeenCalled()
    expect(actionSlot.mock.calls.at(-1)?.[0]).toMatchObject({
      expanded: false,
      overflowed: true,
    })
    expect(typeof actionSlot.mock.calls.at(-1)?.[0].toggle).toBe('function')
    expect(wrapper.get('.custom-action').text()).toBe('展')

    await wrapper.get('.w-ellipsis__action').trigger('click')

    expect(wrapper.get('.custom-action').text()).toBe('收')
    wrapper.unmount()
  })

  it('shows the built-in tooltip on hover only when collapsed and overflowing', async () => {
    const wrapper = mount(Ellipsis, { props: { text: longText, tooltip: true } })

    await wrapper.get('.w-ellipsis__content').trigger('mouseenter')
    expect(wrapper.find('.w-ellipsis__tooltip').exists()).toBe(false)

    await mockOverflow(wrapper)
    await wrapper.get('.w-ellipsis__content').trigger('mouseenter')

    const tooltip = wrapper.get('.w-ellipsis__tooltip')
    expect(tooltip.text()).toBe(longText)
    expect(tooltip.attributes('role')).toBe('tooltip')
    expect(tooltip.classes()).toContain('w-ellipsis__tooltip--top')
    expect(wrapper.get('.w-ellipsis__content').attributes('aria-describedby')).toBe(
      tooltip.attributes('id'),
    )

    await wrapper.get('.w-ellipsis__content').trigger('mouseleave')
    expect(wrapper.find('.w-ellipsis__tooltip').exists()).toBe(false)
    wrapper.unmount()
  })

  it('supports the tooltip slot and placement', async () => {
    const wrapper = mount(Ellipsis, {
      props: { text: longText, tooltip: true, tooltipPlacement: 'bottom' },
      slots: {
        tooltip: ({ text }) => h('span', { class: 'custom-tooltip' }, `完整内容：${text}`),
      },
    })
    await mockOverflow(wrapper)

    await wrapper.get('.w-ellipsis__content').trigger('focusin')

    const tooltip = wrapper.get('.w-ellipsis__tooltip')
    expect(tooltip.classes()).toContain('w-ellipsis__tooltip--bottom')
    expect(wrapper.get('.custom-tooltip').text()).toBe(`完整内容：${longText}`)
    wrapper.unmount()
  })

  it('hides the tooltip once expanded', async () => {
    const wrapper = mount(Ellipsis, {
      props: { text: longText, tooltip: true, expanded: true },
    })
    await mockOverflow(wrapper)

    await wrapper.get('.w-ellipsis__content').trigger('mouseenter')

    expect(wrapper.find('.w-ellipsis__tooltip').exists()).toBe(false)
    wrapper.unmount()
  })

  it('disconnects the ResizeObserver on unmount', async () => {
    const wrapper = mount(Ellipsis, { props: { text: longText, expandable: true } })
    const current = observer

    wrapper.unmount()

    expect(current?.disconnect).toHaveBeenCalledTimes(1)
  })
})
