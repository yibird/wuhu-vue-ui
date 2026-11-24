import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { defineComponent, h, nextTick, ref, withDirectives } from 'vue'
import { vTooltip } from '../directive'

function queryTooltip() {
  return document.body.querySelector<HTMLElement>('.w-tooltip')
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('vTooltip', () => {
  it('replaces the native title and shows a tooltip on hover', async () => {
    const wrapper = mount(
      defineComponent({
        render: () =>
          withDirectives(h('button', { type: 'button', title: '原生命名' }), [
            [vTooltip, { content: '保存', showDelay: 0 }],
          ]),
      }),
    )

    const button = wrapper.get('button')
    expect(button.attributes('title')).toBeUndefined()

    await button.trigger('pointerenter')
    await nextTick()

    const tooltip = queryTooltip()
    expect(tooltip?.textContent).toBe('保存')
    expect(tooltip?.getAttribute('role')).toBe('tooltip')
    expect(button.attributes('aria-describedby')).toBe(tooltip?.id)

    await button.trigger('pointerleave')
    await nextTick()
    expect(queryTooltip()).toBeNull()
    expect(button.attributes('aria-describedby')).toBeUndefined()

    wrapper.unmount()
    expect(wrapper.html()).toContain('title="原生命名"')
  })

  it('updates visible content and hides when disabled', async () => {
    const content = ref('第一版')
    const disabled = ref(false)

    const wrapper = mount(
      defineComponent({
        render: () =>
          withDirectives(h('button', { type: 'button' }), [
            [vTooltip, { content: content.value, disabled: disabled.value, showDelay: 0 }],
          ]),
      }),
    )

    const button = wrapper.get('button')
    await button.trigger('pointerenter')
    await nextTick()
    expect(queryTooltip()?.textContent).toBe('第一版')

    content.value = '第二版'
    await nextTick()
    expect(queryTooltip()?.textContent).toBe('第二版')

    disabled.value = true
    await nextTick()
    expect(queryTooltip()).toBeNull()

    wrapper.unmount()
  })

  it('closes on Escape until the pointer re-enters', async () => {
    const wrapper = mount(
      defineComponent({
        render: () =>
          withDirectives(h('button', { type: 'button' }), [
            [vTooltip, { content: '可关闭', showDelay: 0 }],
          ]),
      }),
    )

    const button = wrapper.get('button')
    await button.trigger('pointerenter')
    await nextTick()
    expect(queryTooltip()).not.toBeNull()

    button.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(queryTooltip()).toBeNull()

    await button.trigger('pointerenter')
    await nextTick()
    expect(queryTooltip()).not.toBeNull()

    wrapper.unmount()
  })
})
