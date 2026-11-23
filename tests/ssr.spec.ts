// @vitest-environment node
import { createSSRApp, h, type Component } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vite-plus/test'
import Scrollbar from '../packages/scrollbar/src/Scrollbar.vue'
import Copy from '../packages/copy/src/Copy.vue'
import Highlight from '../packages/highlight/src/Highlight.vue'
import Time from '../packages/time/src/Time.vue'
import LazyContainer from '../packages/lazy-container/src/LazyContainer.vue'
import ResizeContainer from '../packages/resize-container/src/ResizeContainer.vue'
import ErrorBoundary from '../packages/error-boundary/src/ErrorBoundary.vue'
import GradientText from '../packages/gradient-text/src/GradientText.vue'
import NumberTicker from '../packages/number-ticker/src/NumberTicker.vue'
import SlidingHighlight from '../packages/sliding-highlight/src/SlidingHighlight.vue'
import ImgComparisonSlider from '../packages/img-comparison-slider/src/ImgComparisonSlider.vue'
import SliderCaptcha from '../packages/slider-captcha/src/slider-captcha.vue'
import CommandMenu from '../packages/command-menu/src/command-menu.vue'
import Cropper from '../packages/cropper/src/Cropper.vue'
import MotionGroup from '../packages/motion-group/src/MotionGroup.vue'
import Gantt from '../packages/gantt/src/Gantt.vue'
import FileViewer from '../packages/file-viewer/src/FileViewer.vue'
import Ellipsis from '../packages/ellipsis/src/Ellipsis.vue'
import Permission from '../packages/permission/src/Permission.vue'
import CountDown from '../packages/count-down/src/CountDown.vue'
import Loading from '../packages/loading/src/Loading.vue'
import View from '../packages/view/src/view.vue'
import Exception from '../packages/exception/src/Exception.vue'
import Ripple from '../packages/ripple/src/Ripple.vue'
import CodeEditor from '../packages/code-editor/src/CodeEditor.vue'
import Dock from '../packages/dock/src/Dock.vue'
import IconPicker from '../packages/icon-picker/src/IconPicker.vue'
import OrgTree from '../packages/org-tree/src/OrgTree.vue'
import JsonViewer from '../packages/json-viewer/src/JsonViewer.vue'
import ContextMenu from '../packages/context-menu/src/ContextMenu.vue'
import SearchPanel from '../packages/search-panel/src/SearchPanel.vue'

interface SsrCase {
  name: string
  component: Component
  props: Record<string, unknown>
}

const cases: SsrCase[] = [
  { name: 'Scrollbar', component: Scrollbar, props: {} },
  { name: 'Copy', component: Copy, props: { text: () => 'hello' } },
  { name: 'Highlight', component: Highlight, props: { text: 'hello', keywords: ['hello'] } },
  { name: 'Time', component: Time, props: { time: Date.now() } },
  { name: 'LazyContainer', component: LazyContainer, props: {} },
  { name: 'ResizeContainer', component: ResizeContainer, props: {} },
  { name: 'ErrorBoundary', component: ErrorBoundary, props: {} },
  { name: 'GradientText', component: GradientText, props: {} },
  { name: 'NumberTicker', component: NumberTicker, props: { value: 42 } },
  { name: 'SlidingHighlight', component: SlidingHighlight, props: {} },
  { name: 'ImgComparisonSlider', component: ImgComparisonSlider, props: {} },
  { name: 'SliderCaptcha', component: SliderCaptcha, props: {} },
  { name: 'CommandMenu', component: CommandMenu, props: { items: [] } },
  { name: 'Cropper', component: Cropper, props: { src: '/photo.jpg' } },
  { name: 'MotionGroup', component: MotionGroup, props: {} },
  { name: 'Gantt', component: Gantt, props: { tasks: [] } },
  { name: 'FileViewer', component: FileViewer, props: {} },
  { name: 'Ellipsis', component: Ellipsis, props: { text: 'hello' } },
  { name: 'Permission', component: Permission, props: { value: 'read' } },
  { name: 'CountDown', component: CountDown, props: { duration: 1000, autoStart: false } },
  { name: 'Loading', component: Loading, props: { open: true } },
  { name: 'View', component: View, props: {} },
  { name: 'Exception', component: Exception, props: {} },
  { name: 'Ripple', component: Ripple, props: {} },
  { name: 'CodeEditor', component: CodeEditor, props: {} },
  { name: 'Dock', component: Dock, props: { model: [] } },
  { name: 'IconPicker', component: IconPicker, props: { items: [] } },
  { name: 'OrgTree', component: OrgTree, props: { data: [{ id: 'a', label: 'A' }] } },
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

describe('SSR rendering', () => {
  it.each(cases)('$name renders without browser globals', async ({ component, props }) => {
    const app = createSSRApp({ render: () => h(component, props) })
    const html = await renderToString(app)
    expect(html.length).toBeGreaterThan(0)
  })
})
