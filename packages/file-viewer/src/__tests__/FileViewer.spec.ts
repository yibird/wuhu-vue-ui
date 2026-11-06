import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vite-plus/test'
import { defineComponent, h, nextTick, onMounted } from 'vue'
import { FileViewer, fileViewerDarkTheme, fileViewerLightTheme } from '../../index'

beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:file-viewer-test'),
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  })
})

async function waitForText(text: string, wrapper: ReturnType<typeof mount>, timeout = 4000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    await flushPromises()
    if (wrapper.text().includes(text)) return
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  throw new Error(`Timed out waiting for text: ${text}\n${wrapper.text()}`)
}

function createPrintRenderer(printResult: boolean, zoom = false) {
  return defineComponent({
    name: 'TestPrintRenderer',
    props: { source: { type: Object, required: true } },
    emits: ['ready'],
    setup(_props, { emit, expose }) {
      onMounted(() => {
        emit('ready', {
          pageCount: 0,
          capabilities: { zoom, rotate: false, paged: false, print: true },
        })
      })
      expose({ print: () => printResult })
      return () => h('div', { class: 'test-print-renderer' }, 'Test renderer')
    },
  })
}

async function mountWithRenderer(renderer: ReturnType<typeof createPrintRenderer>) {
  const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
  const wrapper = mount(FileViewer, {
    props: { file, renderers: { text: renderer } },
  })
  await waitForText('Test renderer', wrapper)
  return wrapper
}

describe('FileViewer', () => {
  it('renders a text file with the lazy-loaded code renderer', async () => {
    const file = new File(['Hello preview\nSecond line'], 'notes.txt', { type: 'text/plain' })
    const wrapper = mount(FileViewer, {
      props: { file },
    })

    await waitForText('Hello preview', wrapper)
    expect(wrapper.text()).toContain('Second line')
    expect(wrapper.find('.w-file-viewer__title').text()).toBe('notes.txt')
    expect(wrapper.find('[aria-label="Download"]').exists()).toBe(true)
    expect(wrapper.emitted('load')).toBeTruthy()
    expect(wrapper.emitted('ready')).toBeTruthy()
    wrapper.unmount()
  })

  it('uses English by default and supports zh-CN', async () => {
    const file = new File(['content'], 'notes.txt', { type: 'text/plain' })
    const english = mount(FileViewer, { props: { file } })
    await waitForText('content', english)
    expect(english.find('[aria-label="Download"]').exists()).toBe(true)

    const chinese = mount(FileViewer, { props: { file, locale: 'zh-CN' } })
    await waitForText('content', chinese)
    expect(chinese.find('[aria-label="下载"]').exists()).toBe(true)
    english.unmount()
    chinese.unmount()
  })

  it('applies light and dark themes', async () => {
    const file = new File(['theme'], 'theme.txt', { type: 'text/plain' })
    const light = mount(FileViewer, { props: { file, theme: 'light' } })
    expect(light.classes()).toContain('is-light')
    expect(light.attributes('data-w-file-viewer-theme')).toBe('light')
    light.unmount()

    const dark = mount(FileViewer, { props: { file, theme: 'dark' } })
    expect(dark.classes()).toContain('is-dark')
    expect(dark.attributes('data-w-file-viewer-theme')).toBe('dark')
    dark.unmount()
  })

  it('publishes complete light and dark token maps', () => {
    expect(fileViewerLightTheme['--w-file-viewer-surface-active']).toBe('#e2e8f0')
    expect(fileViewerLightTheme['--w-file-viewer-text-tertiary']).toBe('#5b6678')
    expect(fileViewerLightTheme['--w-file-viewer-success']).toBe('#047857')
    expect(fileViewerDarkTheme['--w-file-viewer-text-tertiary']).toBe('#94a3b8')
    expect(fileViewerDarkTheme['--w-file-viewer-on-primary']).toBe('#0f172a')
    for (const token of Object.keys(fileViewerLightTheme)) {
      expect(fileViewerDarkTheme[token], token).toBeTruthy()
    }
  })

  it('follows an explicit app data-w-theme when theme is auto', async () => {
    document.documentElement.setAttribute('data-w-theme', 'dark')
    const wrapper = mount(FileViewer, { props: { theme: 'auto' } })
    await flushPromises()
    expect(wrapper.classes()).toContain('is-dark')
    wrapper.unmount()
    document.documentElement.removeAttribute('data-w-theme')
  })

  it('re-resolves auto when the theme prop is applied again', async () => {
    document.documentElement.setAttribute('data-w-theme', 'dark')
    const wrapper = mount(FileViewer, { props: { theme: 'light' } })
    await flushPromises()
    expect(wrapper.classes()).toContain('is-light')

    await wrapper.setProps({ theme: 'auto' })
    await flushPromises()
    expect(wrapper.classes()).toContain('is-dark')

    wrapper.unmount()
    document.documentElement.removeAttribute('data-w-theme')
  })

  it('defers the previous object URL revocation until after the next tick', async () => {
    let sequence = 0
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation(() => `blob:revoke-${++sequence}`)
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const file = new File(['revoke'], 'revoke.txt', { type: 'text/plain' })
    const wrapper = mount(FileViewer, { props: { file } })
    await waitForText('revoke', wrapper)
    await flushPromises()

    const firstUrl = 'blob:revoke-1'
    revokeObjectURL.mockClear()

    ;(wrapper.vm as unknown as { reload: () => void }).reload()
    expect(revokeObjectURL).not.toHaveBeenCalled()

    await nextTick()
    expect(revokeObjectURL).toHaveBeenCalledWith(firstUrl)

    wrapper.unmount()
    createObjectURL.mockRestore()
    revokeObjectURL.mockRestore()
  })

  it('flushes pending object URL revocations when unmounted', async () => {
    let sequence = 0
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation(() => `blob:unmount-${++sequence}`)
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const file = new File(['unmount'], 'unmount.txt', { type: 'text/plain' })
    const wrapper = mount(FileViewer, { props: { file } })
    await waitForText('unmount', wrapper)
    await flushPromises()

    const firstUrl = 'blob:unmount-1'
    revokeObjectURL.mockClear()

    ;(wrapper.vm as unknown as { reload: () => void }).reload()
    wrapper.unmount()

    expect(revokeObjectURL).toHaveBeenCalledWith(firstUrl)
    createObjectURL.mockRestore()
    revokeObjectURL.mockRestore()
  })

  it('shows the empty state without a source', () => {
    const wrapper = mount(FileViewer)
    expect(wrapper.text()).toContain('No file selected')
    expect(wrapper.find('.w-file-viewer__state').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders the unsupported fallback', async () => {
    const file = new File(['binary'], 'animation.xyz', { type: 'application/octet-stream' })
    const wrapper = mount(FileViewer, { props: { file } })
    await waitForText('No preview for this format', wrapper)
    expect(wrapper.find('[data-kind="unsupported"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('supports custom messages and slots', async () => {
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    const wrapper = mount(FileViewer, {
      props: {
        file,
        messages: { viewer: { download: 'Save file' } },
      },
      slots: {
        'toolbar-actions': '<button class="custom-action">Custom</button>',
      },
    })
    await waitForText('hello', wrapper)
    expect(wrapper.find('.custom-action').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Save file"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows a toast when the renderer cannot open the print window', async () => {
    const wrapper = await mountWithRenderer(createPrintRenderer(false))
    await wrapper.find('[aria-label="Print"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('.w-file-viewer__toast').text()).toContain(
      'Allow pop-ups to print this file.',
    )
    expect(wrapper.emitted('print')).toBeFalsy()
    wrapper.unmount()
  })

  it('emits print when the renderer reports success', async () => {
    const wrapper = await mountWithRenderer(createPrintRenderer(true))
    await wrapper.find('[aria-label="Print"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('print')).toHaveLength(1)
    expect(wrapper.find('.w-file-viewer__toast').exists()).toBe(false)
    wrapper.unmount()
  })

  it('emits download only when the file is saved', async () => {
    const file = new File(['save'], 'save.txt', { type: 'text/plain' })
    const wrapper = mount(FileViewer, { props: { file } })
    await waitForText('save', wrapper)

    await wrapper.find('[aria-label="Download"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('download')).toHaveLength(1)
    expect(wrapper.emitted('open')).toBeFalsy()
    expect(wrapper.find('.w-file-viewer__toast').text()).toContain('Download started')

    wrapper.unmount()
  })

  it('reports an open action when download falls back to a new tab', async () => {
    const file = new File(['fallback'], 'fallback.txt', { type: 'text/plain' })
    const wrapper = mount(FileViewer, { props: { file } })
    await waitForText('fallback', wrapper)

    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      throw new Error('download blocked')
    })
    const open = vi.spyOn(window, 'open').mockReturnValue({} as Window)

    await wrapper.find('[aria-label="Download"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('download')).toBeFalsy()
    expect(wrapper.emitted('open')).toHaveLength(1)
    expect(wrapper.find('.w-file-viewer__toast').text()).toContain(
      'The file could not be saved directly',
    )

    wrapper.unmount()
    createObjectURL.mockRestore()
    open.mockRestore()
  })

  it('reports a failure when neither saving nor opening works', async () => {
    const file = new File(['blocked'], 'blocked.txt', { type: 'text/plain' })
    const wrapper = mount(FileViewer, { props: { file } })
    await waitForText('blocked', wrapper)

    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      throw new Error('download blocked')
    })
    const open = vi.spyOn(window, 'open').mockReturnValue(null)

    await wrapper.find('[aria-label="Download"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('download')).toBeFalsy()
    expect(wrapper.emitted('open')).toBeFalsy()
    expect(wrapper.find('.w-file-viewer__toast').text()).toContain(
      'The file could not be downloaded.',
    )

    wrapper.unmount()
    createObjectURL.mockRestore()
    open.mockRestore()
  })

  it('labels the reset zoom button for assistive technology', async () => {
    const wrapper = await mountWithRenderer(createPrintRenderer(true, true))
    const button = wrapper.find('.w-file-viewer__zoom-value')
    expect(button.attributes('title')).toBe('Reset zoom to 100%')
    expect(button.attributes('aria-label')).toBe('Reset zoom to 100%')
    wrapper.unmount()
  })

  it('emits file-drop when a file is dropped on the viewer', async () => {
    const wrapper = mount(FileViewer)
    const file = new File(['dropped'], 'dropped.txt', { type: 'text/plain' })
    const dataTransfer = { types: ['Files'], files: [file] }

    await wrapper.find('.w-file-viewer').trigger('dragover', { dataTransfer })
    expect(wrapper.find('.w-file-viewer__drop-overlay').exists()).toBe(true)

    await wrapper.find('.w-file-viewer').trigger('drop', { dataTransfer })
    expect(wrapper.find('.w-file-viewer__drop-overlay').exists()).toBe(false)
    expect(wrapper.emitted('file-drop')?.[0]?.[0]).toBe(file)
    wrapper.unmount()
  })
})
