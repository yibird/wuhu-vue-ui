import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vite-plus/test'
import { h, nextTick } from 'vue'
import TiptapEditor from '../TiptapEditor.vue'
import type { TiptapEditorExpose, TiptapEditorProps } from '../types'

// jsdom does not implement layout APIs used by ProseMirror's scroll-into-view.
const layoutPrototype = Range.prototype as unknown as {
  getClientRects?: () => DOMRectList
  getBoundingClientRect?: () => DOMRect
}
layoutPrototype.getClientRects ??= () => [] as unknown as DOMRectList
layoutPrototype.getBoundingClientRect ??= () => new DOMRect(0, 0, 0, 0)
Element.prototype.scrollIntoView ??= () => {}

function mountEditor(props: TiptapEditorProps = {}) {
  return mount(TiptapEditor, {
    props: { value: '<p>Hello</p>', ...props },
    attachTo: document.body,
  })
}

function exposed(wrapper: ReturnType<typeof mountEditor>): TiptapEditorExpose {
  return wrapper.vm as unknown as TiptapEditorExpose
}

function firePointer(target: EventTarget, type: string, init: Record<string, unknown> = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(event, { button: 0, pointerId: 1, ...init })
  target.dispatchEvent(event)
}

async function waitForEditor(wrapper: ReturnType<typeof mountEditor>) {
  await flushPromises()
  await nextTick()
  await flushPromises()
  expect(exposed(wrapper).editor).not.toBeNull()
}

describe('TiptapEditor', () => {
  it('renders the toolbar and initial HTML content', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    expect(wrapper.find('.w-tiptap-editor__toolbar').exists()).toBe(true)
    expect(wrapper.find('.ProseMirror').html()).toContain('Hello')
    expect(wrapper.find('[aria-label="加粗"]').attributes('aria-pressed')).toBe('false')
    wrapper.unmount()
  })

  it('renders a live preview when preview is enabled', async () => {
    const wrapper = mountEditor({ preview: '' as unknown as boolean })
    await waitForEditor(wrapper)
    await flushPromises()

    expect(wrapper.get('.w-tiptap-editor__preview').text()).toContain('Hello')

    exposed(wrapper).editor!.commands.selectAll()
    exposed(wrapper).editor!.commands.insertContent('Updated preview')
    await flushPromises()
    await nextTick()
    await flushPromises()

    expect(wrapper.get('.w-tiptap-editor__preview').text()).toContain('Updated preview')
    wrapper.unmount()
  })

  it('toggles the preview from the toolbar', async () => {
    const wrapper = mountEditor({ preview: false })
    await waitForEditor(wrapper)

    expect(wrapper.find('.w-tiptap-editor__preview').exists()).toBe(false)
    const button = wrapper.get('button[aria-label="实时预览"]')
    expect(button.attributes('aria-pressed')).toBe('false')

    await button.trigger('click')
    await flushPromises()
    expect(wrapper.find('.w-tiptap-editor__preview').exists()).toBe(true)
    expect(wrapper.emitted('update:preview')?.[0]).toEqual([true])
    expect(button.attributes('aria-pressed')).toBe('true')

    await button.trigger('click')
    await flushPromises()
    expect(wrapper.find('.w-tiptap-editor__preview').exists()).toBe(false)
    expect(wrapper.emitted('update:preview')?.[1]).toEqual([false])
    wrapper.unmount()
  })

  it('resizes the preview panes from the splitter', async () => {
    const wrapper = mountEditor({ preview: true })
    await waitForEditor(wrapper)
    await flushPromises()

    const body = wrapper.get('.w-tiptap-editor__body').element as HTMLElement
    body.getBoundingClientRect = () => new DOMRect(0, 0, 1000, 400)
    const splitter = wrapper.get('.w-tiptap-editor__splitter')

    firePointer(splitter.element, 'pointerdown', { clientX: 500 })
    firePointer(window, 'pointermove', { clientX: 700 })
    await nextTick()
    expect(splitter.attributes('aria-valuenow')).toBe('70')

    firePointer(window, 'pointerup')
    await splitter.trigger('keydown', { key: 'ArrowLeft' })
    expect(splitter.attributes('aria-valuenow')).toBe('68')

    wrapper.unmount()
  })

  it('emits update:value and change when content changes', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    exposed(wrapper).editor!.commands.selectAll()
    exposed(wrapper).editor!.commands.insertContent('Hello world')
    await flushPromises()

    const html = wrapper.emitted('update:value')?.[0]?.[0]
    expect(html).toContain('Hello world')
    expect(wrapper.emitted('change')?.[0]?.[0]).toBe(html)
    wrapper.unmount()
  })

  it('applies marks from the toolbar', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    exposed(wrapper).editor!.commands.selectAll()
    await nextTick()
    await wrapper.get('[aria-label="加粗"]').trigger('click')
    await flushPromises()

    expect(exposed(wrapper).editor!.isActive('bold')).toBe(true)
    expect(wrapper.get('[aria-label="加粗"]').attributes('aria-pressed')).toBe('true')
    expect(exposed(wrapper).getHTML()).toContain('<strong>')
    wrapper.unmount()
  })

  it('renders the placeholder for an empty document', async () => {
    const wrapper = mountEditor({ value: '' })
    await waitForEditor(wrapper)

    const empty = wrapper.find('.ProseMirror p.is-editor-empty')
    expect(empty.exists()).toBe(true)
    expect(empty.attributes('data-placeholder')).toBe('请输入内容…')
    wrapper.unmount()
  })

  it('syncs content when value changes', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    await wrapper.setProps({ value: '<p>Updated</p>' })
    await flushPromises()

    expect(wrapper.find('.ProseMirror').html()).toContain('Updated')
    wrapper.unmount()
  })

  it('hides the toolbar when toolbar=false, editable=false or disabled', async () => {
    for (const props of [{ toolbar: false }, { editable: false }, { disabled: true }]) {
      const wrapper = mountEditor(props)
      await waitForEditor(wrapper)

      expect(wrapper.find('.w-tiptap-editor__toolbar').exists()).toBe(false)
      wrapper.unmount()
    }
  })

  it('inserts images from a URL', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    await wrapper.get('[aria-label="插入图片"]').trigger('click')
    await wrapper
      .get('.w-tiptap-editor__popover .w-tiptap-editor__link-input')
      .setValue('https://example.com/photo.png')
    await wrapper.get('.w-tiptap-editor__popover').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.ProseMirror img').attributes('src')).toBe('https://example.com/photo.png')
    wrapper.unmount()
  })

  it('uploads files through the imageUpload handler', async () => {
    const upload = vi.fn(async () => 'https://cdn.example.com/photo.png')
    const wrapper = mountEditor({ imageUpload: upload })
    await waitForEditor(wrapper)

    await wrapper.get('[aria-label="插入图片"]').trigger('click')
    const input = wrapper.get('.w-tiptap-editor__file-input').element as HTMLInputElement
    const file = new File([new Uint8Array([137, 80, 78, 71])], 'photo.png', { type: 'image/png' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    await wrapper.get('.w-tiptap-editor__file-input').trigger('change')
    await flushPromises()

    expect(upload).toHaveBeenCalledWith(file, expect.any(AbortSignal))
    expect(wrapper.find('.ProseMirror img').attributes('src')).toBe(
      'https://cdn.example.com/photo.png',
    )
    expect(wrapper.emitted('image-upload-start')?.[0]?.[0]).toBe(file)
    expect(wrapper.emitted('image-upload-success')?.[0]?.[0]).toBe(
      'https://cdn.example.com/photo.png',
    )
    wrapper.unmount()
  })

  it('emits image-upload-error when a file exceeds the limit', async () => {
    const wrapper = mountEditor({ imageMaxSize: 0.000001, imageUpload: vi.fn() })
    await waitForEditor(wrapper)

    await wrapper.get('[aria-label="插入图片"]').trigger('click')
    const input = wrapper.get('.w-tiptap-editor__file-input').element as HTMLInputElement
    const file = new File([new Uint8Array([1, 2, 3, 4])], 'large.png', { type: 'image/png' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    await wrapper.get('.w-tiptap-editor__file-input').trigger('change')
    await flushPromises()

    expect(wrapper.emitted('image-upload-error')?.[0]?.[1]).toBe(file)
    expect(wrapper.find('.w-tiptap-editor__error').exists()).toBe(true)
    wrapper.unmount()
  })

  it('inserts a table with the size picked from the hover grid', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    await wrapper.get('[data-tool-id="table"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('.w-tiptap-editor__table-picker').exists()).toBe(true)
    expect(wrapper.findAll('.w-tiptap-editor__table-picker-cell')).toHaveLength(64)

    await wrapper.get('[data-rows="2"][data-cols="4"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('.w-tiptap-editor__table-picker').exists()).toBe(false)
    expect(wrapper.findAll('.ProseMirror table')).toHaveLength(1)
    expect(wrapper.findAll('.ProseMirror table tr')).toHaveLength(2)
    expect(wrapper.findAll('.ProseMirror table tr:first-child th')).toHaveLength(4)
    wrapper.unmount()
  })

  it('applies font size, paragraph style and sub/superscript marks', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    const editor = exposed(wrapper).editor!
    editor.commands.selectAll()
    await nextTick()

    await wrapper.get('select[aria-label="字号"]').setValue('24px')
    await flushPromises()
    expect(editor.getAttributes('textStyle').fontSize).toBe('24px')
    expect(exposed(wrapper).getHTML()).toContain('font-size: 24px')

    editor.commands.selectAll()
    await nextTick()
    await wrapper.get('select[aria-label="字号"]').setValue('')
    await flushPromises()
    expect(editor.getAttributes('textStyle').fontSize).toBeUndefined()

    await wrapper.get('select[aria-label="段落样式"]').setValue('2')
    await flushPromises()
    expect(editor.getHTML()).toContain('<h2>')

    editor.commands.selectAll()
    await nextTick()
    await wrapper.get('[aria-label="上标"]').trigger('click')
    await flushPromises()
    expect(editor.isActive('superscript')).toBe(true)
    expect(wrapper.find('.ProseMirror sup').exists()).toBe(true)

    await wrapper.get('[aria-label="下标"]').trigger('click')
    await flushPromises()
    expect(editor.isActive('subscript')).toBe(true)
    expect(wrapper.find('.ProseMirror sub').exists()).toBe(true)
    wrapper.unmount()
  })

  it('indents blocks and inserts an emoji from the toolbar', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    const editor = exposed(wrapper).editor!
    editor.commands.setTextSelection(1)
    await nextTick()

    await wrapper.get('[aria-label="增加缩进"]').trigger('click')
    await flushPromises()
    expect(editor.getAttributes('paragraph').indent).toBe(1)
    expect(wrapper.find('.ProseMirror p').attributes('style')).toContain('margin-left')

    await wrapper.get('[aria-label="减少缩进"]').trigger('click')
    await flushPromises()
    expect(editor.getAttributes('paragraph').indent).toBe(0)

    await wrapper.get('[aria-label="表情"]').trigger('click')
    await flushPromises()
    const emoji = wrapper.get('.w-tiptap-editor__emoji')
    const emojiText = emoji.text()
    await emoji.trigger('click')
    await flushPromises()

    expect(editor.getText()).toContain(emojiText)
    expect(wrapper.find('.w-tiptap-editor__emoji-panel').exists()).toBe(false)
    wrapper.unmount()
  })

  it('applies and clears a built-in font family from the toolbar', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    const editor = exposed(wrapper).editor!
    editor.commands.selectAll()
    await nextTick()

    const select = wrapper.get('select[aria-label="字体"]')
    const options = select.findAll('option')
    expect(options).toHaveLength(8)

    const arialValue = options.find((option) => option.text() === 'Arial')!.attributes('value')!
    await select.setValue(arialValue)
    await flushPromises()

    expect(editor.getAttributes('textStyle').fontFamily).toContain('Arial')
    expect(exposed(wrapper).getHTML()).toContain('font-family')

    editor.commands.selectAll()
    await nextTick()
    await select.setValue('')
    await flushPromises()

    expect(editor.getAttributes('textStyle').fontFamily).toBeUndefined()
    expect(exposed(wrapper).getHTML()).not.toContain('font-family')
    wrapper.unmount()
  })

  it('toggles task lists and highlights from the toolbar', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    const editor = exposed(wrapper).editor!
    editor.commands.setTextSelection(1)
    await nextTick()
    await wrapper.get('[aria-label="任务列表"]').trigger('click')
    await flushPromises()
    expect(editor.isActive('taskList')).toBe(true)
    expect(wrapper.find('ul[data-type="taskList"]').exists()).toBe(true)

    editor.commands.selectAll()
    await nextTick()
    await wrapper.get('[aria-label="高亮"]').trigger('click')
    await flushPromises()
    expect(editor.isActive('highlight')).toBe(true)
    expect(wrapper.find('.ProseMirror mark').exists()).toBe(true)
    wrapper.unmount()
  })

  it('copies formatting with the format painter', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    const editor = exposed(wrapper).editor!
    editor.commands.setContent('<p><strong>Bold</strong> plain</p>')
    editor.commands.setTextSelection({ from: 1, to: 5 })
    await nextTick()

    await wrapper.get('[aria-label="格式刷"]').trigger('click')
    expect(wrapper.get('[aria-label="格式刷"]').classes()).toContain('is-active')

    editor.commands.setTextSelection({ from: 6, to: 11 })
    await nextTick()

    expect(exposed(wrapper).getHTML()).toContain('<strong>plain</strong>')
    expect(wrapper.get('[aria-label="格式刷"]').classes()).not.toContain('is-active')
    wrapper.unmount()
  })

  it('inserts video and attachment blocks from the toolbar', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    await wrapper.get('[aria-label="插入视频"]').trigger('click')
    await wrapper
      .get('input[aria-label="输入视频地址（mp4 / webm）"]')
      .setValue('https://example.com/demo.mp4')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const video = wrapper.get('.ProseMirror video')
    expect(video.attributes('src')).toBe('https://example.com/demo.mp4')
    expect(video.attributes('controls')).toBeDefined()

    await wrapper.get('[aria-label="插入附件"]').trigger('click')
    await wrapper.get('input[aria-label="输入附件地址"]').setValue('/files/report.pdf')
    await wrapper.get('input[aria-label="附件名称（可选）"]').setValue('季度报告.pdf')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const attachment = wrapper.get('.ProseMirror a[data-attachment]')
    expect(attachment.text()).toBe('季度报告.pdf')
    expect(attachment.attributes('href')).toBe('/files/report.pdf')
    expect(attachment.attributes('download')).toBe('季度报告.pdf')
    wrapper.unmount()
  })

  it('emits an AI request from the toolbar', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    await wrapper.get('[aria-label="AI 助手"]').trigger('click')
    await wrapper.get('input[aria-label="输入 AI 指令"]').setValue('帮我润色这段文字')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const request = wrapper.emitted('ai')?.[0]?.[0] as { prompt: string } | undefined
    expect(request?.prompt).toBe('帮我润色这段文字')
    wrapper.unmount()
  })

  it('toggles fullscreen and restores body scrolling', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    await wrapper.get('[aria-label="全屏"]').trigger('click')
    expect(wrapper.classes()).toContain('is-fullscreen')
    expect(document.body.style.overflow).toBe('hidden')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.classes()).not.toContain('is-fullscreen')
    expect(document.body.style.overflow).toBe('')
    wrapper.unmount()
  })

  it('syncs aria-disabled and aria-readonly', async () => {
    const wrapper = mountEditor({ editable: false, disabled: true })
    await waitForEditor(wrapper)

    const dom = wrapper.get('.ProseMirror')
    expect(dom.attributes('aria-disabled')).toBe('true')
    expect(dom.attributes('aria-readonly')).toBe('true')
    wrapper.unmount()
  })

  it('keeps a single tab stop and roves with arrow keys', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    const stops = wrapper.findAll('[data-tool-id]')
    expect(stops.filter((stop) => stop.attributes('tabindex') === '0')).toHaveLength(1)

    const tabbable = wrapper.get('[data-tool-id="bold"]')
    await tabbable.trigger('focus')
    await tabbable.trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    const focused = document.activeElement as HTMLElement | null
    expect(focused?.dataset.toolId).toBe('italic')
    wrapper.unmount()
  })

  it('dismisses popovers on outside pointerdown', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    await wrapper.get('[aria-label="插入图片"]').trigger('click')
    expect(wrapper.find('.w-tiptap-editor__popover').exists()).toBe(true)
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(wrapper.find('.w-tiptap-editor__popover').exists()).toBe(false)
    wrapper.unmount()
  })

  it('hides the fullscreen action when disabled', async () => {
    const wrapper = mountEditor({ allowFullscreen: false })
    await waitForEditor(wrapper)

    expect(wrapper.find('[aria-label="全屏"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('restores a pre-existing body overflow on unmount', async () => {
    document.body.style.overflow = 'scroll'
    const wrapper = mountEditor()
    await waitForEditor(wrapper)
    await wrapper.get('[aria-label="全屏"]').trigger('click')
    expect(document.body.style.overflow).toBe('hidden')

    wrapper.unmount()
    expect(document.body.style.overflow).toBe('scroll')
    document.body.style.overflow = ''
  })

  it('accepts JSON content through setContent', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    exposed(wrapper).setContent(
      {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'JSON content' }] }],
      },
      false,
    )
    await flushPromises()
    expect(exposed(wrapper).getHTML()).toContain('JSON content')
    wrapper.unmount()
  })

  it('renders the character count and can hide it', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)
    expect(wrapper.get('.w-tiptap-editor__footer').text()).toContain('字符')
    wrapper.unmount()

    const hidden = mountEditor({ showCount: false })
    await waitForEditor(hidden)
    expect(hidden.find('.w-tiptap-editor__footer').exists()).toBe(false)
    hidden.unmount()
  })

  it('supports a custom toolbar slot', async () => {
    const wrapper = mount(TiptapEditor, {
      props: { value: '<p>Hello</p>' },
      slots: {
        toolbar: ({ editor }: { editor: unknown }) =>
          h('div', { class: 'custom-toolbar', 'data-ready': Boolean(editor) }),
      },
      attachTo: document.body,
    })
    await waitForEditor(wrapper)

    expect(wrapper.find('.custom-toolbar').exists()).toBe(true)
    expect(wrapper.find('.w-tiptap-editor__toolbar').exists()).toBe(false)
    wrapper.unmount()
  })

  it('merges custom labels', async () => {
    const wrapper = mountEditor({ labels: { bold: '加粗文字' } })
    await waitForEditor(wrapper)

    expect(wrapper.find('[aria-label="加粗文字"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="斜体"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('exposes editor helpers and destroys the instance on unmount', async () => {
    const wrapper = mountEditor()
    await waitForEditor(wrapper)

    const api = exposed(wrapper)
    api.setContent('<p>API</p>', false)
    await flushPromises()
    expect(api.getHTML()).toContain('API')
    expect(api.getJSON().type).toBe('doc')

    const instance = api.editor!
    wrapper.unmount()
    expect(instance.isDestroyed).toBe(true)
  })
})
