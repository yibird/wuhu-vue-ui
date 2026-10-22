import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vite-plus/test'
import { defineComponent, h, nextTick, reactive } from 'vue'
import ErrorBoundary from '../ErrorBoundary.vue'

describe('ErrorBoundary', () => {
  it('catches descendant render errors and recovers on reset', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    let shouldThrow = true
    const Broken = defineComponent({
      name: 'BrokenChild',
      setup() {
        return () => {
          if (shouldThrow) {
            shouldThrow = false
            throw new Error('boom')
          }
          return h('div', { class: 'recovered' }, 'recovered')
        }
      },
    })

    const wrapper = mount(ErrorBoundary, {
      props: { showDetails: true },
      slots: { default: () => h(Broken) },
    })
    await nextTick()

    expect(wrapper.find('.w-error-boundary__fallback-container').exists()).toBe(true)
    expect(wrapper.get('.w-error-boundary__fallback-container').attributes('role')).toBe('alert')
    expect(wrapper.find('.w-error-boundary__fallback').exists()).toBe(true)
    expect(wrapper.text()).toContain('boom')
    expect(wrapper.emitted('error')).toHaveLength(1)
    expect(wrapper.emitted('error')?.[0]?.[0]).toMatchObject({
      error: expect.any(Error),
    })

    await wrapper.get('.w-error-boundary__reset').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.w-error-boundary__fallback').exists()).toBe(false)
    expect(wrapper.find('.recovered').exists()).toBe(true)
    expect(wrapper.emitted('reset')).toHaveLength(1)

    wrapper.unmount()
    warn.mockRestore()
    error.mockRestore()
  })

  it('renders a custom fallback slot', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Broken = defineComponent({
      setup() {
        throw new Error('custom')
      },
    })

    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: () => h(Broken),
        fallback: ({ error }: { error: unknown }) =>
          h('div', { class: 'custom-fallback' }, (error as Error).message),
      },
    })
    await nextTick()

    expect(wrapper.get('.custom-fallback').text()).toBe('custom')
    expect(wrapper.find('.w-error-boundary__fallback').exists()).toBe(false)

    wrapper.unmount()
    errorSpy.mockRestore()
    warnSpy.mockRestore()
  })

  it('moves focus to the content after reset', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    let shouldThrow = true
    const Broken = defineComponent({
      setup() {
        return () => {
          if (shouldThrow) {
            shouldThrow = false
            throw new Error('focus')
          }
          return h('div', { class: 'recovered' }, 'recovered')
        }
      },
    })

    const wrapper = mount(ErrorBoundary, {
      attachTo: document.body,
      slots: { default: () => h(Broken) },
    })
    await nextTick()
    await nextTick()

    const fallback = wrapper.get('.w-error-boundary__fallback-container').element
    expect(document.activeElement).toBe(fallback)

    await wrapper.get('.w-error-boundary__reset').trigger('click')
    await nextTick()

    expect(document.activeElement).toBe(wrapper.get('.w-error-boundary__content').element)

    wrapper.unmount()
    warn.mockRestore()
    error.mockRestore()
  })

  it('resets when resetOn is mutated in place', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const resetOn = reactive({ revision: 0 })
    let shouldThrow = true
    const Broken = defineComponent({
      setup() {
        return () => {
          if (shouldThrow) {
            shouldThrow = false
            throw new Error('reset-on')
          }
          return h('div', { class: 'recovered' }, 'recovered')
        }
      },
    })

    const wrapper = mount(ErrorBoundary, {
      props: { resetOn },
      slots: { default: () => h(Broken) },
    })
    await nextTick()

    expect(wrapper.find('.w-error-boundary__fallback-container').exists()).toBe(true)

    resetOn.revision += 1
    await nextTick()

    expect(wrapper.find('.w-error-boundary__fallback-container').exists()).toBe(false)
    expect(wrapper.find('.recovered').exists()).toBe(true)
    expect(wrapper.emitted('reset')).toHaveLength(1)

    wrapper.unmount()
    warn.mockRestore()
    error.mockRestore()
  })
})
