import { flushPromises, mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import Copy from '../Copy.vue'
import { copyToClipboard } from '../useClipboard'

const writeText = vi.fn<() => Promise<void>>()

afterEach(() => {
  writeText.mockReset()
})

function mockClipboard() {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
  Object.defineProperty(window, 'isSecureContext', {
    configurable: true,
    value: true,
  })
}

describe('Copy', () => {
  it('copies the text prop and emits success', async () => {
    mockClipboard()
    writeText.mockResolvedValue(undefined)

    const wrapper = mount(Copy, { props: { text: () => 'hello wuhu' } })
    await wrapper.get('.w-copy__trigger').trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith('hello wuhu')
    expect(wrapper.emitted('success')?.[0]).toEqual(['hello wuhu'])
    expect(wrapper.text()).toContain('已复制')
    wrapper.unmount()
  })

  it('renders the icon by default and only the icon triggers copying', async () => {
    mockClipboard()
    writeText.mockResolvedValue(undefined)

    const wrapper = mount(Copy, {
      props: { text: () => 'icon-trigger' },
      slots: {
        prefix: () => h('span', { class: 'prefix' }, '前缀'),
      },
    })

    expect(wrapper.find('.w-copy__icon').exists()).toBe(true)
    expect(wrapper.find('.w-copy__label').exists()).toBe(false)

    // Clicking the container or non-trigger content must not copy.
    await wrapper.trigger('click')
    await wrapper.get('.prefix').trigger('click')
    await flushPromises()
    expect(writeText).not.toHaveBeenCalled()

    await wrapper.get('.w-copy__trigger').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('icon-trigger')
    wrapper.unmount()
  })

  it('does not expose copy state to prefix and suffix slots', () => {
    const prefixArgs: unknown[] = []
    const suffixArgs: unknown[] = []

    const wrapper = mount(Copy, {
      props: { text: () => 'slot-props' },
      slots: {
        prefix: (...args: unknown[]) => {
          prefixArgs.push(args[0])
          return h('span', { class: 'prefix' })
        },
        suffix: (...args: unknown[]) => {
          suffixArgs.push(args[0])
          return h('span', { class: 'suffix' })
        },
      },
    })

    expect(prefixArgs[0]).toEqual({})
    expect(suffixArgs[0]).toEqual({})
    wrapper.unmount()
  })

  it('renders prefix and suffix slots around the trigger', async () => {
    mockClipboard()
    writeText.mockResolvedValue(undefined)

    const wrapper = mount(Copy, {
      props: { text: () => 'slot-copy' },
      slots: {
        prefix: () => h('span', { class: 'prefix' }, '前缀'),
        suffix: () => h('span', { class: 'suffix' }, '后缀'),
      },
    })

    expect(wrapper.get('.prefix').text()).toBe('前缀')
    expect(wrapper.get('.suffix').text()).toBe('后缀')

    await wrapper.get('.suffix').trigger('click')
    await flushPromises()
    expect(writeText).not.toHaveBeenCalled()

    await wrapper.get('.w-copy__trigger').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('slot-copy')
    wrapper.unmount()
  })

  it('renders the default slot inside the trigger when showIcon is false', async () => {
    mockClipboard()
    writeText.mockResolvedValue(undefined)

    const wrapper = mount(Copy, {
      props: { text: () => 'text-trigger', showIcon: false },
      slots: {
        default: () => h('span', { class: 'custom' }, '自定义复制'),
      },
    })

    expect(wrapper.find('.w-copy__icon').exists()).toBe(false)
    const trigger = wrapper.get('.w-copy__trigger')
    expect(trigger.text()).toBe('自定义复制')

    await trigger.trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('text-trigger')
    wrapper.unmount()
  })

  it('activates the icon trigger with the keyboard', async () => {
    mockClipboard()
    writeText.mockResolvedValue(undefined)

    const wrapper = mount(Copy, { props: { text: () => 'keyboard-copy' } })
    const trigger = wrapper.get('.w-copy__trigger')

    expect(trigger.attributes('role')).toBe('button')
    expect(trigger.attributes('tabindex')).toBe('0')

    await trigger.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith('keyboard-copy')
    wrapper.unmount()
  })

  it('disables the icon trigger', () => {
    const wrapper = mount(Copy, { props: { text: () => 'disabled', disabled: true } })

    expect(wrapper.get('.w-copy__trigger').attributes('aria-disabled')).toBe('true')
    wrapper.unmount()
  })

  it('supports an async text function', async () => {
    mockClipboard()
    writeText.mockResolvedValue(undefined)

    const wrapper = mount(Copy, {
      props: {
        text: async () => {
          await Promise.resolve()
          return 'from-source'
        },
      },
    })
    await wrapper.get('.w-copy__trigger').trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith('from-source')
    wrapper.unmount()
  })

  it('emits error when no text is provided', async () => {
    mockClipboard()
    const wrapper = mount(Copy)

    await wrapper.get('.w-copy__trigger').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('error')).toHaveLength(1)
    expect(writeText).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('clears the copied state when a later async text function fails', async () => {
    mockClipboard()
    writeText.mockResolvedValue(undefined)

    const getText = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('first')
      .mockRejectedValueOnce(new Error('text failed'))
    const wrapper = mount(Copy, { props: { text: getText } })

    await wrapper.get('.w-copy__trigger').trigger('click')
    await flushPromises()

    expect(wrapper.classes()).toContain('is-copied')
    expect(wrapper.text()).toContain('已复制')

    await wrapper.get('.w-copy__trigger').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('error')).toHaveLength(1)
    expect(wrapper.classes()).not.toContain('is-copied')
    expect(wrapper.text()).not.toContain('已复制')
    expect(wrapper.get('.w-copy__live').text()).toBe('')
    wrapper.unmount()
  })

  it('reset cancels a pending async text function', async () => {
    mockClipboard()
    writeText.mockResolvedValue(undefined)

    let resolveText!: (value: string) => void
    const getText = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveText = resolve
        }),
    )
    const wrapper = mount(Copy, { props: { text: getText } })
    const vm = wrapper.vm as unknown as {
      copy: () => Promise<boolean>
      reset: () => void
      loading: boolean
    }

    const pending = vm.copy()
    await flushPromises()

    expect(vm.loading).toBe(true)
    expect(wrapper.get('.w-copy__trigger').attributes('aria-disabled')).toBe('true')

    vm.reset()
    await nextTick()

    expect(vm.loading).toBe(false)
    expect(wrapper.get('.w-copy__trigger').attributes('aria-disabled')).toBeUndefined()

    resolveText('late value')
    await pending
    await flushPromises()

    expect(writeText).not.toHaveBeenCalled()
    expect(wrapper.emitted('success')).toBeUndefined()
    expect(wrapper.emitted('error')).toBeUndefined()
    expect(wrapper.classes()).not.toContain('is-copied')
    wrapper.unmount()
  })

  it('ignores an async text function that resolves after unmount', async () => {
    mockClipboard()
    writeText.mockResolvedValue(undefined)

    let resolveText!: (value: string) => void
    const getText = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveText = resolve
        }),
    )
    const wrapper = mount(Copy, { props: { text: getText } })
    const vm = wrapper.vm as unknown as { copy: () => Promise<boolean> }

    const pending = vm.copy()
    await flushPromises()
    wrapper.unmount()

    resolveText('late value')
    await pending
    await flushPromises()

    expect(writeText).not.toHaveBeenCalled()
    expect(wrapper.emitted('success')).toBeUndefined()
    expect(wrapper.emitted('error')).toBeUndefined()
  })

  it('falls back to execCommand when the Clipboard API is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    })
    const execCommand = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    })

    await copyToClipboard('legacy copy')

    expect(execCommand).toHaveBeenCalledWith('copy')
  })
})
