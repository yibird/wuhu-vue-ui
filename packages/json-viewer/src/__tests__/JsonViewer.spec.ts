import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vite-plus/test'
import { CodeEditor } from '@wuhu-ui/code-editor'
import JsonViewer from '../JsonViewer.vue'
import { formatJsonValue } from '../json'

vi.mock('@wuhu-ui/code-editor', async () => {
  const { defineComponent, h } = await import('vue')

  const MockCodeEditor = defineComponent({
    name: 'CodeEditor',
    props: {
      modelValue: { type: String, default: '' },
      language: { type: String, default: '' },
      theme: { type: String, default: '' },
      readOnly: { type: Boolean, default: false },
      height: { type: [String, Number], default: '' },
      width: { type: [String, Number], default: '' },
      options: { type: Object, default: () => ({}) },
      loadingText: { type: String, default: '' },
    },
    emits: ['ready', 'error'],
    setup(_, { slots, expose }) {
      expose({
        getEditor: () => null,
        focus: () => {},
        layout: () => {},
        getValue: () => '',
      })

      return () =>
        h('div', { class: 'mock-code-editor' }, [
          slots.loading?.(),
          slots.error?.(),
          slots.default?.(),
        ])
    },
  })

  return { CodeEditor: MockCodeEditor }
})

describe('formatJsonValue', () => {
  it('formats objects and arrays', () => {
    expect(formatJsonValue({ a: 1, b: [2] })).toBe('{\n  "a": 1,\n  "b": [\n    2\n  ]\n}')
  })

  it('parses JSON strings and applies the requested indent', () => {
    expect(formatJsonValue('{"a":1}', 4)).toBe('{\n    "a": 1\n}')
  })

  it('keeps invalid JSON strings as-is', () => {
    expect(formatJsonValue('not json')).toBe('not json')
  })

  it('handles empty and circular values', () => {
    expect(formatJsonValue(undefined)).toBe('')

    const circular: Record<string, unknown> = {}
    circular.self = circular
    expect(formatJsonValue(circular)).toBe('[object Object]')
  })
})

describe('JsonViewer', () => {
  it('renders CodeEditor as a read-only JSON viewer', () => {
    const wrapper = mount(JsonViewer, {
      props: {
        value: { a: 1 },
        height: 240,
        width: 480,
        theme: 'vs-dark',
        indent: 4,
      },
    })

    const editor = wrapper.findComponent(CodeEditor)
    expect(wrapper.classes()).toContain('w-json-viewer')
    expect(editor.props('language')).toBe('json')
    expect(editor.props('readOnly')).toBe(true)
    expect(editor.props('height')).toBe(240)
    expect(editor.props('width')).toBe(480)
    expect(editor.props('theme')).toBe('vs-dark')
    expect(editor.props('modelValue')).toBe('{\n    "a": 1\n}')

    wrapper.unmount()
  })

  it('cannot be made editable through Monaco options', () => {
    const wrapper = mount(JsonViewer, {
      props: {
        value: [1, 2],
        options: { readOnly: false, domReadOnly: false, fontSize: 15 },
      },
    })

    const options = wrapper.findComponent(CodeEditor).props('options') as Record<string, unknown>
    expect(options).toMatchObject({
      readOnly: true,
      domReadOnly: true,
      fontSize: 15,
      minimap: { enabled: false },
    })

    wrapper.unmount()
  })

  it('updates the formatted value when the prop changes', async () => {
    const wrapper = mount(JsonViewer, { props: { value: { count: 1 } } })

    await wrapper.setProps({ value: { count: 2 } })

    const editor = wrapper.findComponent(CodeEditor)
    expect(editor.props('modelValue')).toContain('"count": 2')
    wrapper.unmount()
  })

  it('forwards ready and error events', () => {
    const wrapper = mount(JsonViewer, { props: { value: {} } })
    const editor = wrapper.findComponent(CodeEditor)
    const instance = { id: 'editor' }
    const error = new Error('boom')

    editor.vm.$emit('ready', instance)
    editor.vm.$emit('error', error)

    expect(wrapper.emitted('ready')?.[0]).toEqual([instance])
    expect(wrapper.emitted('error')?.[0]).toEqual([error])
    wrapper.unmount()
  })

  it('exposes viewer helpers', () => {
    const wrapper = mount(JsonViewer, { props: { value: { a: 1 } } })
    const vm = wrapper.vm as unknown as {
      getEditor: () => unknown
      getValue: () => string
      getFormattedValue: () => string
      focus: () => void
      layout: () => void
    }

    expect(vm.getEditor()).toBeNull()
    expect(vm.getFormattedValue()).toBe('{\n  "a": 1\n}')
    expect(vm.getValue()).toBe('{\n  "a": 1\n}')
    vm.focus()
    vm.layout()
    wrapper.unmount()
  })
})
