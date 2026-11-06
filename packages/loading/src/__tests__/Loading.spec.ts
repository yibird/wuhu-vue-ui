import { config, flushPromises, mount } from '@vue/test-utils'
import { h, isReadonly, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import Loading from '../Loading.vue'
import { createLoading, destroyAllLoadings, destroyLoading } from '../hooks/createLoading'
import { useLoading } from '../hooks/useLoading'

// Keep real transitions: the default transition stub never emits `after-leave`,
// which is the hook the imperative instances rely on for teardown. The stubbing
// transformer is installed globally by test-utils and would also apply to the
// apps created by `createLoading`.
config.global.stubs = { transition: false }

afterEach(() => {
  destroyAllLoadings()
  document.body.style.overflow = ''
  vi.useRealTimers()
})

const animationClasses = {
  bars: '.w-loading__bars',
  beat: '.w-loading__beat',
  pulse: '.w-loading__pulse',
  ring: '.w-loading__ring',
  spinner: '.w-loading__spinner',
} as const

describe('Loading', () => {
  it.each(Object.entries(animationClasses))('renders the %s animation', (animation, selector) => {
    const wrapper = mount(Loading, {
      props: { animation: animation as keyof typeof animationClasses },
    })

    expect(wrapper.find(selector).exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders nothing when closed', () => {
    const wrapper = mount(Loading, { props: { open: false } })

    expect(wrapper.find('.w-loading').exists()).toBe(false)
    wrapper.unmount()
  })

  it('uses the default slot instead of the built-in animation', () => {
    const wrapper = mount(Loading, {
      slots: {
        default: () => h('span', { class: 'custom-indicator' }, '…'),
      },
    })

    expect(wrapper.get('.custom-indicator').text()).toBe('…')
    expect(wrapper.find('.w-loading__ring').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders title and description props and slots', async () => {
    const wrapper = mount(Loading, {
      props: { title: '加载中', description: '请稍候' },
    })

    expect(wrapper.get('.w-loading__title').text()).toBe('加载中')
    expect(wrapper.get('.w-loading__description').text()).toBe('请稍候')

    await wrapper.setProps({ title: undefined, description: undefined })
    const slotted = mount(Loading, {
      slots: {
        title: () => h('b', '自定义标题'),
        description: () => h('i', '自定义描述'),
      },
    })
    expect(slotted.get('.w-loading__title').text()).toBe('自定义标题')
    expect(slotted.get('.w-loading__description').text()).toBe('自定义描述')

    wrapper.unmount()
    slotted.unmount()
  })

  it('applies size, color and z-index', () => {
    const wrapper = mount(Loading, {
      props: { size: 48, color: 'rgb(1, 2, 3)', full: true, zIndex: 3000 },
    })
    const root = document.body.querySelector('.w-loading') as HTMLElement

    expect(root.style.getPropertyValue('--w-loading-size')).toBe('48px')
    expect(root.style.getPropertyValue('--w-loading-primary')).toBe('rgb(1, 2, 3)')
    expect(root.style.zIndex).toBe('3000')
    wrapper.unmount()
  })

  it('applies the default gradient when gradient is true', () => {
    const wrapper = mount(Loading, { props: { gradient: true } })
    const root = wrapper.get('.w-loading').element as HTMLElement

    const gradient = root.style.getPropertyValue('--w-loading-gradient')
    expect(gradient).toContain('radial-gradient(120% 90% at 0% 0%')
    expect(gradient).toContain('linear-gradient(158deg')
    wrapper.unmount()
  })

  it('builds a background gradient from color stops without changing the animation color', () => {
    const wrapper = mount(Loading, {
      props: { animation: 'ring', gradient: ['#111111', '#222222'] },
    })
    const root = wrapper.get('.w-loading').element as HTMLElement

    expect(root.style.getPropertyValue('--w-loading-gradient')).toBe(
      'linear-gradient(135deg, #111111, #222222)',
    )
    expect(root.style.getPropertyValue('--w-loading-primary')).toBe(
      'var(--w-color-primary, #4f46e5)',
    )
    wrapper.unmount()
  })

  it('keeps a single color stop as a real gradient', () => {
    const wrapper = mount(Loading, { props: { gradient: ['#111111'] } })
    const root = wrapper.get('.w-loading').element as HTMLElement

    expect(root.style.getPropertyValue('--w-loading-gradient')).toBe(
      'linear-gradient(135deg, #111111, #111111)',
    )
    wrapper.unmount()
  })

  it('accepts a raw CSS gradient', () => {
    const wrapper = mount(Loading, {
      props: { gradient: 'linear-gradient(90deg, red, blue)' },
    })
    const root = wrapper.get('.w-loading').element as HTMLElement

    expect(root.style.getPropertyValue('--w-loading-gradient')).toBe(
      'linear-gradient(90deg, red, blue)',
    )
    wrapper.unmount()
  })

  it('renders a fullscreen mask and can disable it', async () => {
    const wrapper = mount(Loading, { props: { full: true } })
    await nextTick()

    const root = document.body.querySelector('.w-loading') as HTMLElement
    expect(root.classList.contains('w-loading--full')).toBe(true)
    expect(root.classList.contains('w-loading--masked')).toBe(true)

    await wrapper.setProps({ mask: false })
    expect(root.classList.contains('w-loading--masked')).toBe(false)

    wrapper.unmount()
  })

  it('locks body scroll for a visible fullscreen loading', async () => {
    const wrapper = mount(Loading, { props: { full: true } })
    await nextTick()

    expect(document.body.style.overflow).toBe('hidden')

    wrapper.unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('passes class and style through to the semantic root', () => {
    const wrapper = mount(Loading, {
      attrs: { class: 'consumer-loading', style: 'color: rgb(1, 2, 3)' },
    })
    const root = wrapper.get('.w-loading')

    expect(root.classes()).toContain('consumer-loading')
    expect((root.element as HTMLElement).style.color).toBe('rgb(1, 2, 3)')
    wrapper.unmount()
  })

  it('applies semantic classes and styles to internal parts', () => {
    const wrapper = mount(Loading, {
      props: {
        animation: 'pulse',
        title: 'Title',
        description: 'Description',
        classes: {
          root: 'root-part',
          content: 'content-part',
          indicator: 'indicator-part',
          title: 'title-part',
          description: 'description-part',
        },
        styles: {
          root: { color: 'rgb(1, 2, 3)' },
          content: { gap: '20px' },
          indicator: { opacity: '0.5' },
          title: { color: 'rgb(4, 5, 6)' },
          description: { color: 'rgb(7, 8, 9)' },
        },
      },
    })

    expect(wrapper.get('.w-loading').classes()).toContain('root-part')
    expect(wrapper.get('.w-loading').classes()).toContain('w-loading--pulse')
    expect(wrapper.get('.w-loading__content').classes()).toContain('content-part')
    expect(wrapper.get('.w-loading__indicator').classes()).toContain('indicator-part')
    expect(wrapper.get('.w-loading__title').classes()).toContain('title-part')
    expect(wrapper.get('.w-loading__description').classes()).toContain('description-part')

    expect((wrapper.get('.w-loading__content').element as HTMLElement).style.gap).toBe('20px')
    expect((wrapper.get('.w-loading__indicator').element as HTMLElement).style.opacity).toBe('0.5')
    expect((wrapper.get('.w-loading__title').element as HTMLElement).style.color).toBe(
      'rgb(4, 5, 6)',
    )
    expect((wrapper.get('.w-loading__description').element as HTMLElement).style.color).toBe(
      'rgb(7, 8, 9)',
    )

    wrapper.unmount()
  })

  it('emits update:open when close() is called', async () => {
    const wrapper = mount(Loading)

    ;(wrapper.vm as unknown as { close: () => void }).close()
    await nextTick()

    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
    wrapper.unmount()
  })
})

describe('useLoading', () => {
  it('opens, closes and toggles visibility', () => {
    const { visible, open, close, toggle } = useLoading()

    expect(isReadonly(visible)).toBe(true)
    expect(visible.value).toBe(false)
    open()
    expect(visible.value).toBe(true)
    toggle()
    expect(visible.value).toBe(false)
    toggle()
    expect(visible.value).toBe(true)
    close()
    expect(visible.value).toBe(false)
  })
})

/**
 * Renders the closed state, runs Vue's double-rAF leave transition and flushes
 * the teardown tick. jsdom's own rAF clock is not driven by fake timers, so the
 * frame callbacks are bridged onto the fake timer queue.
 */
async function settleTransition() {
  vi.useFakeTimers()
  const raf = vi
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((callback: FrameRequestCallback) => {
      setTimeout(() => callback(0), 0)
      return 1
    })
  await nextTick()
  vi.advanceTimersByTime(500)
  raf.mockRestore()
  vi.useRealTimers()
  await nextTick()
  await flushPromises()
}

describe('imperative loading', () => {
  it('creates, updates and closes an instance', async () => {
    const instance = createLoading({ title: '正在保存' })
    await nextTick()
    await flushPromises()

    expect(document.body.querySelector('.w-loading__title')?.textContent).toBe('正在保存')

    instance.update({ title: '即将完成' })
    await nextTick()
    expect(document.body.querySelector('.w-loading__title')?.textContent).toBe('即将完成')

    instance.close()
    await settleTransition()

    expect(document.body.querySelector('[data-w-loading]')).toBeNull()
    expect(document.body.querySelector('.w-loading')).toBeNull()
  })

  it('cancels pending destruction when reopened', async () => {
    const instance = createLoading({ title: '再打开' })
    await nextTick()
    instance.close()
    instance.update({ open: true })
    await settleTransition()

    expect(document.body.querySelector('[data-w-loading]')).not.toBeNull()
    expect(document.body.querySelector('.w-loading')).not.toBeNull()

    instance.close()
    await settleTransition()
    expect(document.body.querySelector('[data-w-loading]')).toBeNull()
  })

  it('destroys even when onClose throws', async () => {
    const instance = createLoading({
      onClose: () => {
        throw new Error('close failed')
      },
    })
    await nextTick()

    expect(() => instance.close()).toThrow('close failed')
    await settleTransition()
    expect(document.body.querySelector('[data-w-loading]')).toBeNull()
  })

  it('closes and destroys an instance that never opened', async () => {
    const instance = createLoading({ open: false })
    await nextTick()
    expect(document.body.querySelector('.w-loading')).toBeNull()

    instance.close()
    await settleTransition()

    expect(document.body.querySelector('[data-w-loading]')).toBeNull()
    expect(() => instance.update({ title: 'ignored' })).not.toThrow()
  })

  it('makes destroy idempotent', async () => {
    const instance = createLoading()
    await nextTick()

    instance.destroy()
    instance.destroy()
    instance.close()
    instance.update({ title: 'ignored' })
    await settleTransition()

    expect(document.body.querySelector('[data-w-loading]')).toBeNull()
  })

  it('destroys a specific instance and all instances', async () => {
    const first = createLoading({ title: 'A' })
    const second = createLoading({ title: 'B' })
    await nextTick()
    await flushPromises()

    expect(document.body.querySelectorAll('.w-loading')).toHaveLength(2)

    destroyLoading(first)
    await flushPromises()
    expect(document.body.querySelectorAll('.w-loading')).toHaveLength(1)

    destroyLoading(second.id)
    await flushPromises()
    expect(document.body.querySelectorAll('.w-loading')).toHaveLength(0)
  })
})
