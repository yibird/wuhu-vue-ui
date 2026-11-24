import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'
import { h, nextTick } from 'vue'
import ImgComparisonSlider from '../ImgComparisonSlider.vue'

function pointer(type: string, init: Record<string, unknown>) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(event, { button: 0, pointerId: 1, clientX: 20, ...init })
  return event
}

describe('ImgComparisonSlider', () => {
  it('applies semantic classes and styles to internal parts', () => {
    const wrapper = mount(ImgComparisonSlider, {
      props: {
        before: '/before.png',
        after: '/after.png',
        classes: {
          root: 'custom-root',
          before: 'custom-before',
          after: 'custom-after',
          image: 'custom-image',
          handle: 'custom-handle',
          line: 'custom-line',
          knob: 'custom-knob',
        },
        styles: {
          root: { padding: '2px' },
          line: { width: '3px' },
          knob: { color: 'rgb(1, 2, 3)' },
          handle: { color: 'rgb(4, 5, 6)' },
        },
      },
    })

    expect(wrapper.get('.w-img-comparison-slider').classes()).toContain('custom-root')
    expect(wrapper.get('.w-img-comparison-slider__layer--before').classes()).toContain(
      'custom-before',
    )
    expect(wrapper.get('.w-img-comparison-slider__layer--after').classes()).toContain(
      'custom-after',
    )
    expect(wrapper.get('.custom-before img').classes()).toContain('custom-image')
    expect(wrapper.get('.w-img-comparison-slider__handle').classes()).toContain('custom-handle')
    expect(wrapper.get('.w-img-comparison-slider__line').classes()).toContain('custom-line')
    expect(wrapper.get('.w-img-comparison-slider__knob').classes()).toContain('custom-knob')

    const root = wrapper.get('.w-img-comparison-slider').element as HTMLElement
    const line = wrapper.get('.w-img-comparison-slider__line').element as HTMLElement
    const knob = wrapper.get('.w-img-comparison-slider__knob').element as HTMLElement
    expect(root.style.padding).toBe('2px')
    expect(line.style.width).toBe('3px')
    expect(knob.style.color).toBe('rgb(1, 2, 3)')
    expect(wrapper.get('[role="slider"]').attributes('aria-label')).toBe('图片对比滑块')

    wrapper.unmount()
  })

  it('supports keyboard navigation in uncontrolled mode', async () => {
    const wrapper = mount(ImgComparisonSlider, {
      props: { keyboardStep: 5 },
    })
    const slider = wrapper.get('[role="slider"]')

    await slider.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:value')?.[0]).toEqual([55])
    expect(wrapper.emitted('change')?.[0]).toEqual([55])

    await slider.trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('update:value')?.[1]).toEqual([0])

    await slider.trigger('keydown', { key: 'End' })
    expect(wrapper.emitted('update:value')?.[2]).toEqual([100])
    expect(slider.attributes('aria-valuenow')).toBe('100')
    expect(wrapper.emitted('dragstart')).toBeUndefined()
    expect(wrapper.emitted('dragend')).toBeUndefined()
  })

  it('does not emit while disabled', async () => {
    const wrapper = mount(ImgComparisonSlider, {
      props: { disabled: true },
    })

    await wrapper.get('[role="slider"]').trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('update:value')).toBeUndefined()
  })

  it('reverts when a controlled parent rejects the update', async () => {
    const wrapper = mount(ImgComparisonSlider, {
      props: { value: 50, keyboardStep: 5 },
    })
    const slider = wrapper.get('[role="slider"]')

    await slider.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:value')?.[0]).toEqual([55])
    expect(slider.attributes('aria-valuenow')).toBe('50')
  })

  it('updates its position when the model changes', async () => {
    const wrapper = mount(ImgComparisonSlider, {
      props: { value: 20 },
    })

    await wrapper.setProps({ value: 75 })
    expect(wrapper.get('[role="slider"]').attributes('aria-valuenow')).toBe('75')
  })

  it('exposes vertical orientation', () => {
    const wrapper = mount(ImgComparisonSlider, {
      props: { direction: 'vertical' },
    })

    expect(wrapper.get('[role="slider"]').attributes('aria-orientation')).toBe('vertical')
  })

  it('uses the arrow keys that match the slider direction', async () => {
    const horizontal = mount(ImgComparisonSlider, { props: { keyboardStep: 5 } })
    const horizontalSlider = horizontal.get('[role="slider"]')

    await horizontalSlider.trigger('keydown', { key: 'ArrowRight' })
    expect(horizontal.emitted('update:value')?.[0]).toEqual([55])

    await horizontalSlider.trigger('keydown', { key: 'ArrowUp' })
    expect(horizontal.emitted('update:value')).toHaveLength(1)
    horizontal.unmount()

    const vertical = mount(ImgComparisonSlider, {
      props: { direction: 'vertical', keyboardStep: 5 },
    })
    const verticalSlider = vertical.get('[role="slider"]')

    await verticalSlider.trigger('keydown', { key: 'ArrowUp' })
    expect(vertical.emitted('update:value')?.[0]).toEqual([45])

    await verticalSlider.trigger('keydown', { key: 'ArrowDown' })
    expect(vertical.emitted('update:value')?.[1]).toEqual([50])

    await verticalSlider.trigger('keydown', { key: 'ArrowRight' })
    expect(vertical.emitted('update:value')).toHaveLength(2)
    vertical.unmount()
  })

  it('clips both layers at 0% and 100%', async () => {
    const wrapper = mount(ImgComparisonSlider)
    const beforeLayer = wrapper.get('.w-img-comparison-slider__layer--before')
    const afterLayer = wrapper.get('.w-img-comparison-slider__layer--after')
    const slider = wrapper.get('[role="slider"]')

    await slider.trigger('keydown', { key: 'Home' })
    expect(beforeLayer.attributes('style')).toContain('inset(0 100% 0 0)')
    expect(afterLayer.attributes('style')).toContain('inset(0 0 0 0%)')
    expect(slider.attributes('aria-valuenow')).toBe('0')
    expect(slider.attributes('aria-valuetext')).toBe('0%')

    await slider.trigger('keydown', { key: 'End' })
    expect(beforeLayer.attributes('style')).toContain('inset(0 0% 0 0)')
    expect(afterLayer.attributes('style')).toContain('inset(0 0 0 100%)')
    expect(slider.attributes('aria-valuenow')).toBe('100')
    expect(slider.attributes('aria-valuetext')).toBe('100%')
  })

  it('keeps fractional precision in aria values', async () => {
    const wrapper = mount(ImgComparisonSlider, {
      props: { keyboardStep: 0.1 },
    })
    const slider = wrapper.get('[role="slider"]')

    for (let index = 0; index < 4; index += 1) {
      await slider.trigger('keydown', { key: 'ArrowRight' })
    }

    expect(wrapper.emitted('update:value')?.at(-1)).toEqual([50.4])
    expect(slider.attributes('aria-valuenow')).toBe('50.4')
    expect(slider.attributes('aria-valuetext')).toBe('50.4%')
  })

  it('hides broken images, shows a placeholder and emits the error side', async () => {
    const wrapper = mount(ImgComparisonSlider, {
      props: { before: '/missing-before.png', after: '/after.png' },
    })
    const beforeLayer = wrapper.get('.w-img-comparison-slider__layer--before')

    await beforeLayer.get('img').trigger('error')

    expect(beforeLayer.find('img').exists()).toBe(false)
    expect(beforeLayer.classes()).toContain('has-image-error')
    expect(wrapper.find('.w-img-comparison-slider__layer--after img').exists()).toBe(true)
    expect(wrapper.emitted('error')?.[0]?.[0]).toBe('before')
  })

  it('restores the failed image when its source changes', async () => {
    const wrapper = mount(ImgComparisonSlider, {
      props: { before: '/missing-before.png' },
    })
    const beforeLayer = wrapper.get('.w-img-comparison-slider__layer--before')

    await beforeLayer.get('img').trigger('error')
    expect(beforeLayer.find('img').exists()).toBe(false)

    await wrapper.setProps({ before: '/recovered-before.png' })
    expect(beforeLayer.find('img').exists()).toBe(true)
    expect(beforeLayer.classes()).not.toContain('has-image-error')
  })

  it('restores the previous value when a pointer gesture is canceled', async () => {
    const wrapper = mount(ImgComparisonSlider, {
      attachTo: document.body,
    })
    const root = wrapper.get('.w-img-comparison-slider')
    ;(root.element as HTMLElement).getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect

    root.element.dispatchEvent(pointer('pointerdown', { clientX: 20 }))
    expect(wrapper.emitted('update:value')?.[0]).toEqual([20])

    window.dispatchEvent(pointer('pointercancel', { clientX: 0, clientY: 0 }))
    await nextTick()

    expect(wrapper.emitted('update:value')?.at(-1)).toEqual([50])
    expect(wrapper.get('[role="slider"]').attributes('aria-valuenow')).toBe('50')
    wrapper.unmount()
  })

  it('does not hijack pointer interactions from interactive slot content', () => {
    const wrapper = mount(ImgComparisonSlider, {
      attachTo: document.body,
      slots: {
        before: () => h('button', { class: 'slot-action', type: 'button' }, '播放'),
      },
    })
    const root = wrapper.get('.w-img-comparison-slider')
    ;(root.element as HTMLElement).getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect

    wrapper.get('.slot-action').element.dispatchEvent(pointer('pointerdown', { clientX: 20 }))

    expect(wrapper.emitted('update:value')).toBeUndefined()
    expect(wrapper.emitted('dragstart')).toBeUndefined()
    wrapper.unmount()
  })

  it('emits dragstart with the value before the pointer moves the divider', () => {
    const wrapper = mount(ImgComparisonSlider, {
      attachTo: document.body,
    })
    const root = wrapper.get('.w-img-comparison-slider')
    ;(root.element as HTMLElement).getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect

    root.element.dispatchEvent(pointer('pointerdown', { clientX: 20 }))

    expect(wrapper.emitted('dragstart')?.[0]).toEqual([50])
    expect(wrapper.emitted('update:value')?.[0]).toEqual([20])

    window.dispatchEvent(pointer('pointerup', { clientX: 20 }))
    wrapper.unmount()
  })

  it('stops an active drag once when disabled mid-gesture', async () => {
    const wrapper = mount(ImgComparisonSlider, {
      attachTo: document.body,
    })
    const root = wrapper.get('.w-img-comparison-slider')
    ;(root.element as HTMLElement).getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect

    root.element.dispatchEvent(pointer('pointerdown', { clientX: 20 }))
    expect(wrapper.emitted('update:value')?.[0]).toEqual([20])
    const updatesWhileDragging = wrapper.emitted('update:value')?.length

    await wrapper.setProps({ disabled: true })
    expect(wrapper.emitted('dragend')).toHaveLength(1)
    expect(wrapper.emitted('dragend')?.[0]).toEqual([20])

    window.dispatchEvent(pointer('pointermove', { clientX: 80 }))
    window.dispatchEvent(pointer('pointerup', { clientX: 80 }))
    await nextTick()

    expect(wrapper.emitted('update:value')?.length).toBe(updatesWhileDragging)
    expect(wrapper.emitted('dragend')).toHaveLength(1)
    wrapper.unmount()
  })

  it('fills the container height when aspectRatio is auto', () => {
    const wrapper = mount(ImgComparisonSlider, {
      props: { aspectRatio: 'auto', direction: 'vertical' },
    })

    const root = wrapper.element as HTMLElement
    expect(root.style.aspectRatio).toBe('auto')
    expect(root.style.height).toBe('100%')

    wrapper.unmount()
  })
})
