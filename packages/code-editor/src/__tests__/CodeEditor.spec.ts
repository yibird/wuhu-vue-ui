import { flushPromises, mount } from '@vue/test-utils'
import { h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import CodeEditor from '../CodeEditor.vue'
import type { CodeEditorExpose, CodeEditorProps } from '../types'

const monacoMock = vi.hoisted(() => {
  const state = {
    value: '',
    createError: null as Error | null,
  }
  const changeHandlers = new Set<() => void>()
  const focusHandlers = new Set<() => void>()
  const blurHandlers = new Set<() => void>()

  const model = {
    id: 'mock-model',
    dispose: vi.fn(),
    getValue: vi.fn(() => state.value),
  }

  const editor = {
    getValue: vi.fn(() => state.value),
    setValue: vi.fn((next: string) => {
      state.value = next
      for (const handler of changeHandlers) handler()
    }),
    focus: vi.fn(() => {
      for (const handler of focusHandlers) handler()
    }),
    blur: vi.fn(() => {
      for (const handler of blurHandlers) handler()
    }),
    layout: vi.fn(),
    updateOptions: vi.fn(),
    dispose: vi.fn(),
    getModel: vi.fn(() => model),
    onDidChangeModelContent: vi.fn((handler: () => void) => {
      changeHandlers.add(handler)
      return { dispose: vi.fn(() => changeHandlers.delete(handler)) }
    }),
    onDidFocusEditorText: vi.fn((handler: () => void) => {
      focusHandlers.add(handler)
      return { dispose: vi.fn(() => focusHandlers.delete(handler)) }
    }),
    onDidBlurEditorText: vi.fn((handler: () => void) => {
      blurHandlers.add(handler)
      return { dispose: vi.fn(() => blurHandlers.delete(handler)) }
    }),
  }

  const createModel = vi.fn((initial: string) => {
    state.value = initial
    return model
  })

  const create = vi.fn((_container: HTMLElement, _options: Record<string, unknown>) => {
    if (state.createError) {
      const error = state.createError
      state.createError = null
      throw error
    }
    return editor
  })

  const setModelLanguage = vi.fn()
  const setTheme = vi.fn()

  return {
    state,
    editor,
    model,
    setModelLanguage,
    setTheme,
    setCreateError(error: Error | null) {
      state.createError = error
    },
    reset() {
      vi.clearAllMocks()
      state.value = ''
      state.createError = null
      changeHandlers.clear()
      focusHandlers.clear()
      blurHandlers.clear()
    },
    module: {
      editor: {
        createModel,
        create,
        setModelLanguage,
        setTheme,
      },
    },
  }
})

vi.mock('monaco-editor', () => monacoMock.module)

async function mountReady(props: CodeEditorProps = {}) {
  const wrapper = mount(CodeEditor, { props })
  await flushPromises()
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  monacoMock.reset()
})

describe('CodeEditor', () => {
  it('shows loading text and creates the editor after loading', async () => {
    const wrapper = mount(CodeEditor, { props: { loadingText: '正在准备' } })

    expect(wrapper.classes()).toContain('is-loading')
    expect(wrapper.text()).toContain('正在准备')

    await flushPromises()
    await flushPromises()

    expect(wrapper.classes()).toContain('is-ready')
    expect(wrapper.text()).not.toContain('正在准备')
    expect(monacoMock.editor.onDidChangeModelContent).toHaveBeenCalled()
    expect(wrapper.emitted('ready')?.[0]?.[0]).toBe(monacoMock.editor)

    wrapper.unmount()
  })

  it('creates a model with the initial value and forwards options', async () => {
    const wrapper = await mountReady({
      value: 'const answer = 42',
      language: 'typescript',
      theme: 'vs-dark',
      height: 200,
      width: 480,
      options: { fontSize: 15, minimap: { enabled: false } },
    })

    expect(monacoMock.module.editor.createModel).toHaveBeenCalledWith(
      'const answer = 42',
      'typescript',
    )
    const options = monacoMock.module.editor.create.mock.calls[0]?.[1] ?? {}
    expect(options).toMatchObject({
      theme: 'vs-dark',
      readOnly: false,
      automaticLayout: true,
      fontSize: 15,
      minimap: { enabled: false },
    })
    expect(wrapper.attributes('style')).toContain('height: 200px')
    expect(wrapper.attributes('style')).toContain('width: 480px')

    wrapper.unmount()
  })

  it('emits value updates from the editor', async () => {
    const wrapper = await mountReady({ value: 'a' })

    monacoMock.editor.setValue('b')

    expect(wrapper.emitted('update:value')?.[0]).toEqual(['b'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['b'])

    wrapper.unmount()
  })

  it('syncs external value without echoing it back', async () => {
    const wrapper = await mountReady({ value: 'a' })

    await wrapper.setProps({ value: 'external' })

    expect(monacoMock.editor.setValue).toHaveBeenCalledWith('external')
    expect(wrapper.emitted('update:value')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()

    wrapper.unmount()
  })

  it('resolves theme auto from data-w-theme', async () => {
    document.documentElement.setAttribute('data-w-theme', 'dark')
    try {
      const wrapper = await mountReady({ theme: 'auto' })

      const options = monacoMock.module.editor.create.mock.calls[0]?.[1] ?? {}
      expect(options).toMatchObject({ theme: 'vs-dark' })

      document.documentElement.setAttribute('data-w-theme', 'light')
      await wrapper.setProps({ theme: 'vs-dark' })
      await wrapper.setProps({ theme: 'auto' })
      await flushPromises()
      expect(monacoMock.setTheme).toHaveBeenLastCalledWith('vs')

      wrapper.unmount()
    } finally {
      document.documentElement.removeAttribute('data-w-theme')
    }
  })

  it('updates language, theme, readOnly and disabled state', async () => {
    const wrapper = await mountReady()

    await wrapper.setProps({ language: 'json', theme: 'hc-black', readOnly: true })

    expect(monacoMock.setModelLanguage).toHaveBeenCalledWith(monacoMock.model, 'json')
    expect(monacoMock.setTheme).toHaveBeenCalledWith('hc-black')
    expect(monacoMock.editor.updateOptions).toHaveBeenCalledWith({ readOnly: true })

    await wrapper.setProps({ disabled: true })

    expect(monacoMock.editor.updateOptions).toHaveBeenLastCalledWith({ readOnly: true })
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.attributes('aria-disabled')).toBe('true')

    wrapper.unmount()
  })

  it('forwards focus and blur events', async () => {
    const wrapper = await mountReady()

    monacoMock.editor.focus()
    expect(wrapper.emitted('focus')).toHaveLength(1)

    monacoMock.editor.blur()
    expect(wrapper.emitted('blur')).toHaveLength(1)

    wrapper.unmount()
  })

  it('exposes editor controls', async () => {
    const wrapper = await mountReady({ value: 'a' })
    const vm = wrapper.vm as unknown as CodeEditorExpose

    expect(vm.getEditor()).toBe(monacoMock.editor)
    expect(vm.getValue()).toBe('a')

    vm.setValue('b')
    expect(monacoMock.editor.setValue).toHaveBeenCalledWith('b')

    vm.setLanguage('markdown')
    expect(monacoMock.setModelLanguage).toHaveBeenCalledWith(monacoMock.model, 'markdown')

    vm.setTheme('vs-dark')
    expect(monacoMock.setTheme).toHaveBeenCalledWith('vs-dark')

    vm.focus()
    expect(monacoMock.editor.focus).toHaveBeenCalled()

    vm.layout()
    expect(monacoMock.editor.layout).toHaveBeenCalled()

    wrapper.unmount()
  })

  it('disposes the editor, listeners and model on unmount', async () => {
    const wrapper = await mountReady()

    wrapper.unmount()

    expect(monacoMock.editor.onDidChangeModelContent).toHaveBeenCalled()
    expect(monacoMock.editor.dispose).toHaveBeenCalled()
    expect(monacoMock.model.dispose).toHaveBeenCalled()
  })

  it('shows an error and retries after a failed initialization', async () => {
    monacoMock.setCreateError(new Error('boom'))

    const wrapper = await mountReady()

    expect(wrapper.classes()).toContain('is-error')
    expect(wrapper.text()).toContain('boom')
    expect(wrapper.emitted('error')?.[0]?.[0]).toBeInstanceOf(Error)

    await wrapper.get('.w-code-editor__retry').trigger('click')
    await flushPromises()
    await flushPromises()

    expect(wrapper.classes()).toContain('is-ready')
    expect(wrapper.text()).not.toContain('boom')

    wrapper.unmount()
  })

  it('renders the error slot with error and retry', async () => {
    monacoMock.setCreateError(new Error('nope'))

    const wrapper = mount(CodeEditor, {
      slots: {
        error: ({ error }: { error: Error; retry: () => void }) =>
          h('span', `自定义错误: ${error.message}`),
      },
    })
    await flushPromises()
    await flushPromises()

    expect(wrapper.find('.w-code-editor__retry').exists()).toBe(false)
    expect(wrapper.text()).toContain('自定义错误: nope')

    wrapper.unmount()
  })
})
