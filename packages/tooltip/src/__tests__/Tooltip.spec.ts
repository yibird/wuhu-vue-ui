import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { nextTick } from 'vue'
import Tooltip from '../Tooltip.vue'

function queryTooltip() {
  return document.body.querySelector<HTMLElement>('.w-tooltip')
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('Tooltip', () => {
  it('shows on hover and hides on pointer leave', async () => {
    const wrapper = mount(Tooltip, {
      props: { content: '复制链接' },
      slots: { default: '<button type="button">复制</button>' },
    })

    const trigger = wrapper.get('.w-tooltip__trigger')
    expect(queryTooltip()).toBeNull()

    await trigger.trigger('pointerenter')
    await nextTick()

    const tooltip = queryTooltip()
    expect(tooltip).not.toBeNull()
    expect(tooltip?.textContent).toBe('复制链接')
    expect(tooltip?.getAttribute('role')).toBe('tooltip')
    expect(tooltip?.dataset.placement).toBe('top')
    expect(trigger.attributes('aria-describedby')).toBe(tooltip?.id)

    await trigger.trigger('pointerleave')
    await nextTick()

    expect(queryTooltip()).toBeNull()
    expect(trigger.attributes('aria-describedby')).toBeUndefined()

    wrapper.unmount()
  })

  it('positions against an anchor and keeps consumer describedby tokens', async () => {
    const anchor = document.createElement('button')
    anchor.setAttribute('aria-describedby', 'consumer')
    document.body.appendChild(anchor)

    const wrapper = mount(Tooltip, {
      props: { content: '焦点提示', anchor, open: true },
    })

    await nextTick()

    const tooltip = queryTooltip()
    expect(tooltip?.textContent).toBe('焦点提示')
    expect(anchor.getAttribute('aria-describedby')).toContain('consumer')
    expect(anchor.getAttribute('aria-describedby')).toContain(tooltip?.id)

    wrapper.unmount()

    expect(anchor.getAttribute('aria-describedby')).toBe('consumer')
  })

  it('respects showDelay and cancelled timers', async () => {
    vi.useFakeTimers()

    const wrapper = mount(Tooltip, {
      props: { content: '延迟提示', showDelay: 120 },
      slots: { default: '<button type="button">触发</button>' },
    })

    const trigger = wrapper.get('.w-tooltip__trigger')
    await trigger.trigger('pointerenter')
    expect(queryTooltip()).toBeNull()

    vi.advanceTimersByTime(120)
    await nextTick()
    expect(queryTooltip()).not.toBeNull()

    await trigger.trigger('pointerleave')
    vi.advanceTimersByTime(120)
    await nextTick()
    expect(queryTooltip()).toBeNull()

    wrapper.unmount()
  })

  it('does not render while disabled or empty', async () => {
    const wrapper = mount(Tooltip, {
      props: { content: '不可见', disabled: true },
      slots: { default: '<button type="button">触发</button>' },
    })

    await wrapper.get('.w-tooltip__trigger').trigger('pointerenter')
    await nextTick()
    expect(queryTooltip()).toBeNull()

    await wrapper.setProps({ disabled: false, content: '' })
    await wrapper.get('.w-tooltip__trigger').trigger('pointerenter')
    await nextTick()
    expect(queryTooltip()).toBeNull()

    wrapper.unmount()
  })

  it('supports v-model:open', async () => {
    const wrapper = mount(Tooltip, {
      props: { content: '受控', open: false },
      slots: { default: '<button type="button">触发</button>' },
    })

    await wrapper.get('.w-tooltip__trigger').trigger('pointerenter')
    await nextTick()
    expect(wrapper.emitted('update:open')?.[0]).toEqual([true])

    await wrapper.setProps({ open: true })
    await nextTick()
    expect(queryTooltip()?.textContent).toBe('受控')

    wrapper.unmount()
  })

  it('closes on Escape', async () => {
    const wrapper = mount(Tooltip, {
      props: { content: '按 Esc 关闭' },
      slots: { default: '<button type="button">触发</button>' },
    })

    await wrapper.get('.w-tooltip__trigger').trigger('pointerenter')
    await nextTick()
    expect(queryTooltip()).not.toBeNull()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(queryTooltip()).toBeNull()

    wrapper.unmount()
  })

  it('renders custom content and supports in-place teleport', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'ignored', open: true, teleport: false },
      slots: {
        default: '<button type="button">触发</button>',
        content: '<strong class="custom-tip">富文本</strong>',
      },
    })

    await nextTick()

    expect(document.body.querySelector('.w-tooltip .custom-tip')?.textContent).toBe('富文本')

    wrapper.unmount()
  })
})
