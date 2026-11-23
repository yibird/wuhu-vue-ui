import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vite-plus/test'
import { defineComponent, nextTick, ref, type Component } from 'vue'

vi.mock('monaco-editor', () => {
  const model = { getValue: () => '', dispose: vi.fn() }
  const editor = {
    getValue: () => '',
    setValue: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    layout: vi.fn(),
    updateOptions: vi.fn(),
    dispose: vi.fn(),
    getModel: () => model,
    onDidChangeModelContent: () => ({ dispose: vi.fn() }),
    onDidFocusEditorText: () => ({ dispose: vi.fn() }),
    onDidBlurEditorText: () => ({ dispose: vi.fn() }),
  }

  return {
    editor: {
      create: vi.fn(() => editor),
      createModel: vi.fn(() => model),
      setModelLanguage: vi.fn(),
      setTheme: vi.fn(),
    },
  }
})

vi.mock('cropperjs', () => ({
  // oxlint-disable-next-line unicorn/consistent-function-scoping
  default: function CropperMock() {
    return {
      getCropperImage: () => ({ $ready: async () => ({}) }),
      getCropperSelection: () => ({
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        $change: vi.fn(),
      }),
      getCropperCanvas: () => ({
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
      destroy: vi.fn(),
    }
  },
  DEFAULT_TEMPLATE: '<cropper-canvas></cropper-canvas>',
}))

import WuCommandMenu from '../packages/command-menu/src/command-menu.vue'
import WuCopy from '../packages/copy/src/Copy.vue'
import WuCropper from '../packages/cropper/src/Cropper.vue'
import WuErrorBoundary from '../packages/error-boundary/src/ErrorBoundary.vue'
import WuFileViewer from '../packages/file-viewer/src/FileViewer.vue'
import WuGantt from '../packages/gantt/src/Gantt.vue'
import WuGradientText from '../packages/gradient-text/src/GradientText.vue'
import WuHighlight from '../packages/highlight/src/Highlight.vue'
import WuImgComparisonSlider from '../packages/img-comparison-slider/src/ImgComparisonSlider.vue'
import WuLazyContainer from '../packages/lazy-container/src/LazyContainer.vue'
import WuNumberTicker from '../packages/number-ticker/src/NumberTicker.vue'
import WuResizeContainer from '../packages/resize-container/src/ResizeContainer.vue'
import WuScrollbar from '../packages/scrollbar/src/Scrollbar.vue'
import WuSlidingHighlight from '../packages/sliding-highlight/src/SlidingHighlight.vue'
import WuMotionGroup from '../packages/motion-group/src/MotionGroup.vue'
import WuTime from '../packages/time/src/Time.vue'
import Ellipsis from '../packages/ellipsis/src/Ellipsis.vue'
import CountDown from '../packages/count-down/src/CountDown.vue'
import Ripple from '../packages/ripple/src/Ripple.vue'
import CodeEditor from '../packages/code-editor/src/CodeEditor.vue'
import OrgTree from '../packages/org-tree/src/OrgTree.vue'
import Dock from '../packages/dock/src/Dock.vue'
import Loading from '../packages/loading/src/Loading.vue'
import View from '../packages/view/src/view.vue'
import SliderCaptcha from '../packages/slider-captcha/src/slider-captcha.vue'
import IconPicker from '../packages/icon-picker/src/IconPicker.vue'
import JsonViewer from '../packages/json-viewer/src/JsonViewer.vue'
import ContextMenu from '../packages/context-menu/src/ContextMenu.vue'
import SearchPanel from '../packages/search-panel/src/SearchPanel.vue'

interface AttrCase {
  name: string
  component: Component
  props?: Record<string, unknown>
  slots?: Record<string, string>
}

const defaultSlot = { default: '<span data-slot>content</span>' }

const components: AttrCase[] = [
  { name: 'WuScrollbar', component: WuScrollbar },
  { name: 'WuCopy', component: WuCopy, props: { text: 'hello' } },
  {
    name: 'WuHighlight',
    component: WuHighlight,
    props: { text: 'hello world', keywords: ['hello'] },
  },
  { name: 'WuTime', component: WuTime, props: { time: Date.now() } },
  { name: 'WuLazyContainer', component: WuLazyContainer },
  { name: 'WuResizeContainer', component: WuResizeContainer },
  { name: 'WuErrorBoundary', component: WuErrorBoundary },
  { name: 'WuGradientText', component: WuGradientText },
  { name: 'WuNumberTicker', component: WuNumberTicker, props: { value: 42 } },
  { name: 'WuSlidingHighlight', component: WuSlidingHighlight },
  {
    name: 'WuImgComparisonSlider',
    component: WuImgComparisonSlider,
    props: { modelValue: 50 },
  },
  { name: 'WuCommandMenu', component: WuCommandMenu, props: { items: [] } },
  { name: 'WuCropper', component: WuCropper, props: { src: '/photo.jpg' } },
  {
    name: 'WuMotionGroup',
    component: WuMotionGroup,
    slots: { default: '<span key="a">item</span>' },
  },
  {
    name: 'WuGantt',
    component: WuGantt,
    props: {
      tasks: [{ id: 'a', name: 'Task A', start: '2026-10-01', end: '2026-10-03' }],
    },
  },
  { name: 'WuFileViewer', component: WuFileViewer },
  { name: 'Ellipsis', component: Ellipsis, props: { text: 'hello world' } },
  { name: 'CountDown', component: CountDown, props: { duration: 1000, autoStart: false } },
  { name: 'Ripple', component: Ripple },
  { name: 'CodeEditor', component: CodeEditor },
  {
    name: 'OrgTree',
    component: OrgTree,
    props: { data: [{ id: 'root', label: 'Root' }] },
  },
  { name: 'Dock', component: Dock, props: { model: [{ label: 'Home' }] } },
  { name: 'Loading', component: Loading },
  { name: 'View', component: View, props: { full: false } },
  { name: 'SliderCaptcha', component: SliderCaptcha },
  { name: 'IconPicker', component: IconPicker, props: { items: [] } },
  { name: 'JsonViewer', component: JsonViewer, props: { value: { a: 1 } } },
  {
    name: 'ContextMenu',
    component: ContextMenu,
    props: {
      open: true,
      items: [{ key: 'a', label: 'A' }],
    },
  },
  {
    name: 'SearchPanel',
    component: SearchPanel,
    props: {
      open: true,
      items: [{ key: 'a', label: 'A' }],
    },
  },
]

describe('class / style pass-through contract', () => {
  it.each(components)(
    '$name merges consumer class/style onto its semantic root',
    async ({ component, props = {}, slots = defaultSlot }) => {
      const wrapper = mount(component, {
        props,
        slots,
        attrs: {
          class: 'consumer-class',
          style: 'color: rgb(1, 2, 3)',
          'data-consumer': 'yes',
        },
      })

      await flushPromises()
      await nextTick()

      // Components rooted in Teleport expose a comment node as wrapper.element;
      // icon components expose an SVGElement. Fall back to the first rendered
      // semantic element for the Teleport case.
      const loading = wrapper.find('.w-loading')
      // ContextMenu teleports its panel to body, so it is outside the wrapper tree.
      const contextMenu = document.querySelector<HTMLElement>('.w-context-menu')
      // SearchPanel teleports its dialog to body; consumer attrs land on the panel.
      const searchPanel = document.querySelector<HTMLElement>('.w-search-panel__panel')
      const first = wrapper.find('*')
      const root = (contextMenu ??
        searchPanel ??
        (wrapper.element instanceof Element
          ? wrapper.element
          : loading.exists()
            ? loading.element
            : first.element)) as HTMLElement
      const classes = Array.from(root.classList)

      expect(classes).toContain('consumer-class')
      expect(classes.some((name) => name.startsWith('w-'))).toBe(true)
      expect(root.style.color).toBe('rgb(1, 2, 3)')
      expect(root.dataset.consumer).toBe('yes')

      wrapper.unmount()
    },
  )

  it('WuScrollbar keeps class/style on the root and routes aria attributes to the wrap', async () => {
    const wrapper = mount(WuScrollbar, {
      slots: defaultSlot,
      attrs: {
        class: 'consumer-class',
        style: 'color: rgb(1, 2, 3)',
        'aria-label': '内容区域',
      },
    })

    await nextTick()

    const root = wrapper.element as HTMLElement
    const view = wrapper.get('.w-scrollbar__view').element as HTMLElement
    const wrap = wrapper.get('.w-scrollbar__wrap')

    expect(root.tagName).toBe('DIV')
    expect(root.classList.contains('consumer-class')).toBe(true)
    expect(root.style.color).toBe('rgb(1, 2, 3)')
    expect(root.getAttribute('aria-label')).toBeNull()
    expect(wrap.attributes('aria-label')).toBe('内容区域')
    expect(view.tagName).toBe('DIV')

    wrapper.unmount()
  })

  it('ResizeContainer keeps declared class/style in sync across re-renders', async () => {
    const color = ref('rgb(1, 2, 3)')
    const className = ref('first-class')

    const Host = defineComponent({
      components: { WuResizeContainer },
      setup() {
        return { color, className }
      },
      template: `
        <WuResizeContainer :class="className" :style="{ color }">
          <span data-slot>content</span>
        </WuResizeContainer>
      `,
    })

    const wrapper = mount(Host)
    await nextTick()

    const root = wrapper.element as HTMLElement
    expect(root.classList.contains('w-resize-container')).toBe(true)
    expect(root.classList.contains('first-class')).toBe(true)
    expect(root.style.color).toBe('rgb(1, 2, 3)')

    color.value = 'rgb(4, 5, 6)'
    className.value = 'second-class'
    await nextTick()

    expect(root.classList.contains('second-class')).toBe(true)
    expect(root.classList.contains('first-class')).toBe(false)
    expect(root.style.color).toBe('rgb(4, 5, 6)')

    wrapper.unmount()
  })
})
