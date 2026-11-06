import { mount } from '@vue/test-utils'
import { defineComponent, effectScope, h, withDirectives } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import Ripple from '../Ripple.vue'
import { vRipple } from '../directive'
import { useRipple } from '../useRipple'

function mockRect(element: Element, width = 100, height = 40) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect)
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Ripple component', () => {
  it('creates a wave on click and removes it when the animation ends', async () => {
    const wrapper = mount(Ripple, { props: { trigger: 'click' } })
    const root = wrapper.get('.w-ripple')
    mockRect(root.element)

    await root.trigger('click', { clientX: 30, clientY: 10 })

    expect(root.find('.w-ripple__wave').exists()).toBe(true)

    await root.get('.w-ripple__wave').trigger('animationend')
    expect(root.find('.w-ripple__wave').exists()).toBe(false)

    wrapper.unmount()
  })

  it('does not create waves when disabled', async () => {
    const wrapper = mount(Ripple, { props: { trigger: 'click', disabled: true } })
    const root = wrapper.get('.w-ripple')
    mockRect(root.element)

    await root.trigger('click')
    await root.trigger('pointerdown')

    expect(root.find('.w-ripple__wave').exists()).toBe(false)
    wrapper.unmount()
  })

  it('expands from the center for keyboard clicks', async () => {
    const wrapper = mount(Ripple, { props: { trigger: 'click' } })
    const root = wrapper.get('.w-ripple')
    mockRect(root.element, 100, 40)

    root.element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 0, clientX: 0, clientY: 0 }),
    )

    const wave = root.get('.w-ripple__wave').element as HTMLElement
    const radius = Math.hypot(50, 20)
    expect(wave.style.width).toBe(`${radius * 2}px`)
    expect(wave.style.left).toBe(`${50 - radius}px`)
    expect(wave.style.top).toBe(`${20 - radius}px`)

    wrapper.unmount()
  })

  it('renders the configured tag, slot, class and style', () => {
    const wrapper = mount(Ripple, {
      props: { tag: 'button', trigger: 'click' },
      attrs: { class: 'custom-ripple', style: 'color: red', type: 'button' },
      slots: { default: '波纹按钮' },
    })

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.classes()).toContain('w-ripple')
    expect(wrapper.classes()).toContain('custom-ripple')
    expect(wrapper.attributes('style')).toContain('color')
    expect(wrapper.text()).toBe('波纹按钮')

    wrapper.unmount()
  })

  it('cleans up waves on unmount', async () => {
    const wrapper = mount(Ripple, { props: { trigger: 'click' } })
    const root = wrapper.get('.w-ripple')
    mockRect(root.element)

    await root.trigger('click')
    expect(root.find('.w-ripple__wave').exists()).toBe(true)

    wrapper.unmount()
    expect(root.element.querySelector('.w-ripple__wave')).toBeNull()
  })
})

describe('vRipple directive', () => {
  it('adds the host class and restores the original position on unmount', () => {
    const Test = defineComponent({
      setup() {
        return () => withDirectives(h('button', { class: 'target' }, '波纹'), [[vRipple]])
      },
    })
    const wrapper = mount(Test)
    const node = wrapper.get('.target').element as HTMLElement

    expect(node.style.position).toBe('relative')
    // Clipping is provided by the host class, not by an inline style.
    expect(node.style.overflow).toBe('')
    expect(node.classList.contains('w-ripple-host')).toBe(true)
    expect(node.classList.contains('w-ripple')).toBe(false)

    wrapper.unmount()

    expect(node.style.position).toBe('')
    expect(node.classList.contains('w-ripple-host')).toBe(false)
  })

  it('does not override existing positioning on the host', () => {
    const Test = defineComponent({
      setup() {
        return () =>
          withDirectives(h('button', { class: 'target', style: 'position: absolute' }, '波纹'), [
            [vRipple],
          ])
      },
    })
    const wrapper = mount(Test)
    const node = wrapper.get('.target').element as HTMLElement

    expect(node.style.position).toBe('absolute')
    expect(node.classList.contains('w-ripple-host')).toBe(true)

    wrapper.unmount()

    expect(node.style.position).toBe('absolute')
    expect(node.classList.contains('w-ripple-host')).toBe(false)
  })

  it('keeps a pre-existing host class on unmount', () => {
    const Test = defineComponent({
      setup() {
        return () =>
          withDirectives(h('button', { class: 'target w-ripple-host' }, '波纹'), [[vRipple]])
      },
    })
    const wrapper = mount(Test)
    const node = wrapper.get('.target').element as HTMLElement

    wrapper.unmount()

    expect(node.classList.contains('w-ripple-host')).toBe(true)
  })

  it('passes options through to the wave', async () => {
    const Test = defineComponent({
      setup() {
        return () =>
          withDirectives(h('button', { class: 'target' }, '波纹'), [
            [
              vRipple,
              {
                color: 'rgb(1, 2, 3)',
                duration: 250,
                trigger: 'click',
              },
            ],
          ])
      },
    })
    const wrapper = mount(Test)
    const node = wrapper.get('.target')
    mockRect(node.element)

    await node.trigger('click')

    const wave = node.get('.w-ripple__wave').element as HTMLElement
    expect(wave.style.getPropertyValue('--w-ripple-color')).toBe('rgb(1, 2, 3)')
    expect(wave.style.getPropertyValue('--w-ripple-duration')).toBe('250ms')

    wrapper.unmount()
  })

  it('removes waves and listeners on unmount', async () => {
    const Test = defineComponent({
      setup() {
        return () =>
          withDirectives(h('button', { class: 'target' }, '波纹'), [
            [vRipple, { trigger: 'click' }],
          ])
      },
    })
    const wrapper = mount(Test)
    const node = wrapper.get('.target')
    const element = node.element as HTMLElement
    mockRect(element)

    await node.trigger('click')
    expect(element.querySelector('.w-ripple__wave')).not.toBeNull()

    wrapper.unmount()

    expect(element.querySelector('.w-ripple__wave')).toBeNull()
    element.dispatchEvent(new Event('click', { bubbles: true }))
    expect(element.querySelector('.w-ripple__wave')).toBeNull()
  })

  it('does not accumulate residual waves', async () => {
    const Test = defineComponent({
      setup() {
        return () =>
          withDirectives(h('button', { class: 'target' }, '波纹'), [
            [vRipple, { trigger: 'click' }],
          ])
      },
    })
    const wrapper = mount(Test)
    const node = wrapper.get('.target')
    mockRect(node.element)

    await node.trigger('click')
    await node.trigger('click')
    expect(node.findAll('.w-ripple__wave')).toHaveLength(2)

    for (const wave of node.findAll('.w-ripple__wave')) {
      await wave.trigger('animationend')
    }

    expect(node.find('.w-ripple__wave').exists()).toBe(false)
    wrapper.unmount()
  })

  it('respects the disabled option', async () => {
    const Test = defineComponent({
      setup() {
        return () =>
          withDirectives(h('button', { class: 'target' }, '波纹'), [[vRipple, { disabled: true }]])
      },
    })
    const wrapper = mount(Test)
    const node = wrapper.get('.target')
    mockRect(node.element)

    await node.trigger('pointerdown')
    expect(node.find('.w-ripple__wave').exists()).toBe(false)

    wrapper.unmount()
  })
})

describe('useRipple', () => {
  it('exposes createRipple and removes the node after animationend', () => {
    const { createRipple } = useRipple()
    const element = document.createElement('button')
    mockRect(element)
    document.body.appendChild(element)

    const wave = createRipple(element, undefined, { color: 'red', duration: 120 })

    expect(wave).not.toBeNull()
    expect(element.querySelector('.w-ripple__wave')).toBe(wave)

    wave?.dispatchEvent(new Event('animationend'))
    expect(element.querySelector('.w-ripple__wave')).toBeNull()

    element.remove()
  })

  it('skips DOM creation when the duration is zero', () => {
    const { createRipple } = useRipple()
    const element = document.createElement('button')
    mockRect(element)
    document.body.appendChild(element)

    expect(createRipple(element, undefined, { duration: 0 })).toBeNull()
    expect(element.querySelector('.w-ripple__wave')).toBeNull()

    element.remove()
  })

  it('removes waves through the fallback timer', () => {
    const { createRipple } = useRipple()
    const element = document.createElement('button')
    mockRect(element)
    document.body.appendChild(element)

    const wave = createRipple(element, undefined, { duration: 50 })
    expect(wave?.isConnected).toBe(true)

    vi.advanceTimersByTime(150)
    expect(wave?.isConnected).toBe(false)
    expect(element.querySelector('.w-ripple__wave')).toBeNull()

    element.remove()
  })

  it('disposes waves when the owning scope stops', () => {
    const scope = effectScope()
    const element = document.createElement('button')
    mockRect(element)
    document.body.appendChild(element)
    let wave: HTMLElement | null = null

    scope.run(() => {
      const { createRipple } = useRipple()
      wave = createRipple(element)
    })

    expect(wave).not.toBeNull()
    expect(wave!.isConnected).toBe(true)

    scope.stop()
    expect(wave!.isConnected).toBe(false)
    expect(element.querySelector('.w-ripple__wave')).toBeNull()

    element.remove()
  })
})
