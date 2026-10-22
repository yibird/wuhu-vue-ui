import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import SliderCaptcha from '../slider-captcha.vue'

function createContext() {
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    clip: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  } as unknown as CanvasRenderingContext2D
}

interface Exposed {
  offset: number
  target: { x: number; y: number }
  refresh: () => void
  reset: () => void
  verify: () => boolean
}

async function mountCaptcha(props: Record<string, unknown> = {}) {
  const wrapper = mount(SliderCaptcha, { props })
  await nextTick()
  await nextTick()
  return wrapper
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(createContext())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SliderCaptcha', () => {
  it('renders the captcha canvases and slider', async () => {
    const wrapper = await mountCaptcha()
    const exposed = wrapper.vm as unknown as Exposed

    expect(wrapper.findAll('canvas')).toHaveLength(2)
    expect(wrapper.find('[role="slider"]').exists()).toBe(true)
    expect(wrapper.get('.w-slider-captcha__tip').text()).toBe('向右拖动滑块完成拼图')
    expect(exposed.offset).toBe(0)
    expect(wrapper.get('[role="slider"]').attributes('aria-valuenow')).toBe('0')

    wrapper.unmount()
  })

  it('emits success when the slider offset matches the target', async () => {
    const wrapper = await mountCaptcha({ tolerance: 9999 })
    const slider = wrapper.get('[role="slider"]')

    await slider.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('success')).toHaveLength(1)
    expect(wrapper.emitted('success')?.[0]?.[0]).toMatchObject({
      offset: 0,
      attempts: 1,
    })
    expect(wrapper.classes()).toContain('is-success')
    expect((slider.element as HTMLElement).style.transform).toBe('translate3d(276px, 0, 0)')
    expect(wrapper.get('.w-slider-captcha__fill').attributes('style')).toContain('width: 298px')
    expect((wrapper.vm as unknown as Exposed).offset).toBe(0)
    wrapper.unmount()
  })

  it('emits fail when the offset is outside the tolerance', async () => {
    const wrapper = await mountCaptcha({ tolerance: 0, refreshOnFail: false })
    const slider = wrapper.get('[role="slider"]')

    await slider.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('fail')).toHaveLength(1)
    expect(wrapper.classes()).toContain('is-error')
    expect(wrapper.get('.w-slider-captcha__tip').text()).toBe('验证失败，请重试')
    wrapper.unmount()
  })

  it('supports keyboard navigation and Home / End', async () => {
    const wrapper = await mountCaptcha()
    const slider = wrapper.get('[role="slider"]')

    await slider.trigger('keydown', { key: 'ArrowRight' })
    expect(slider.attributes('aria-valuenow')).toBe('2')

    await slider.trigger('keydown', { key: 'ArrowRight', shiftKey: true })
    expect(slider.attributes('aria-valuenow')).toBe('12')

    await slider.trigger('keydown', { key: 'Home' })
    expect(slider.attributes('aria-valuenow')).toBe('0')

    await slider.trigger('keydown', { key: 'End' })
    expect(slider.attributes('aria-valuenow')).toBe('276')
    wrapper.unmount()
  })

  it('drags the handle with pointer events', async () => {
    const wrapper = await mountCaptcha({ tolerance: 9999 })
    const slider = wrapper.get('[role="slider"]')

    slider.element.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 10 }),
    )
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 90 }))
    window.dispatchEvent(new MouseEvent('pointerup'))
    await nextTick()

    expect(slider.attributes('aria-valuenow')).toBe('80')
    expect(wrapper.emitted('success')).toHaveLength(1)
    wrapper.unmount()
  })

  it('does not interact when disabled', async () => {
    const wrapper = await mountCaptcha({ disabled: true })
    const slider = wrapper.get('[role="slider"]')

    await slider.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('success')).toBeUndefined()
    expect(slider.attributes('tabindex')).toBe('-1')
    expect(slider.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('applies semantic classes and styles to internal parts', async () => {
    const wrapper = await mountCaptcha({
      classes: {
        root: 'root-part',
        image: 'image-part',
        canvas: 'canvas-part',
        piece: 'piece-part',
        refresh: 'refresh-part',
        slider: 'slider-part',
        fill: 'fill-part',
        tip: 'tip-part',
        handle: 'handle-part',
        live: 'live-part',
      },
      styles: {
        root: { color: 'rgb(1, 2, 3)' },
        image: { opacity: '0.9' },
        slider: { gap: '4px' },
        tip: { color: 'rgb(4, 5, 6)' },
      },
    })

    expect(wrapper.classes()).toContain('root-part')
    expect(wrapper.get('.w-slider-captcha__image').classes()).toContain('image-part')
    expect(wrapper.get('.w-slider-captcha__canvas').classes()).toContain('canvas-part')
    expect(wrapper.get('.w-slider-captcha__piece').classes()).toContain('piece-part')
    expect(wrapper.get('.w-slider-captcha__refresh').classes()).toContain('refresh-part')
    expect(wrapper.get('.w-slider-captcha__slider').classes()).toContain('slider-part')
    expect(wrapper.get('.w-slider-captcha__fill').classes()).toContain('fill-part')
    expect(wrapper.get('.w-slider-captcha__tip').classes()).toContain('tip-part')
    expect(wrapper.get('.w-slider-captcha__handle').classes()).toContain('handle-part')
    expect(wrapper.get('.w-slider-captcha__live').classes()).toContain('live-part')

    expect((wrapper.get('.w-slider-captcha').element as HTMLElement).style.color).toBe(
      'rgb(1, 2, 3)',
    )
    expect((wrapper.get('.w-slider-captcha__image').element as HTMLElement).style.opacity).toBe(
      '0.9',
    )
    expect((wrapper.get('.w-slider-captcha__slider').element as HTMLElement).style.gap).toBe('4px')
    expect((wrapper.get('.w-slider-captcha__tip').element as HTMLElement).style.color).toBe(
      'rgb(4, 5, 6)',
    )
    wrapper.unmount()
  })

  it('exposes refresh and reset methods', async () => {
    const wrapper = await mountCaptcha()
    const exposed = wrapper.vm as unknown as Exposed

    await wrapper.get('[role="slider"]').trigger('keydown', { key: 'ArrowRight' })
    expect(exposed.offset).toBe(2)

    exposed.refresh()
    await nextTick()
    expect(wrapper.emitted('refresh')).toHaveLength(1)
    expect(exposed.offset).toBe(0)

    exposed.reset()
    expect(exposed.offset).toBe(0)
    wrapper.unmount()
  })
})
