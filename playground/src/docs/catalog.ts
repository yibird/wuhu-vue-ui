import type { Component } from 'vue'
import ScrollbarDemo from '../demos/scrollbar-demo.vue'
import CopyDemo from '../demos/copy-demo.vue'
import HighlightDemo from '../demos/highlight-demo.vue'
import TimeDemo from '../demos/time-demo.vue'
import LazyContainerDemo from '../demos/lazy-container-demo.vue'
import ResizeContainerDemo from '../demos/resize-container-demo.vue'
import ErrorBoundaryDemo from '../demos/error-boundary-demo.vue'
import GradientTextDemo from '../demos/gradient-text-demo.vue'
import NumberTickerDemo from '../demos/number-ticker-demo.vue'
import SlidingHighlightDemo from '../demos/sliding-highlight-demo.vue'
import ImgComparisonDemo from '../demos/img-comparison-demo.vue'
import SliderCaptchaDemo from '../demos/slider-captcha-demo.vue'
import CommandMenuDemo from '../demos/command-menu-demo.vue'
import ContextMenuDemo from '../demos/context-menu-demo.vue'
import CropperDemo from '../demos/cropper-demo.vue'
import MotionGroupDemo from '../demos/motion-group-demo.vue'
import GanttDemo from '../demos/gantt-demo.vue'
import FileViewerDemo from '../demos/file-viewer-demo.vue'
import EllipsisDemo from '../demos/ellipsis-demo.vue'
import PermissionDemo from '../demos/permission-demo.vue'
import CountDownDemo from '../demos/count-down-demo.vue'
import LoadingDemo from '../demos/loading-demo.vue'
import ViewDemo from '../demos/view-demo.vue'
import ExceptionDemo from '../demos/exception-demo.vue'
import RippleDemo from '../demos/ripple-demo.vue'
import CodeEditorDemo from '../demos/code-editor-demo.vue'
import DockDemo from '../demos/dock-demo.vue'
import IconPickerDemo from '../demos/icon-picker-demo.vue'
import OrgTreeDemo from '../demos/org-tree-demo.vue'
import JsonViewerDemo from '../demos/json-viewer-demo.vue'
import TiptapEditorDemo from '../demos/tiptap-editor-demo.vue'
import SearchPanelDemo from '../demos/search-panel-demo.vue'
import type { ComponentMeta } from './component-meta'
import { componentCategories, componentMetas, metasByCategory } from './component-meta'

export type { ComponentCategory, ComponentCategoryId, ComponentMeta } from './component-meta'

export interface ComponentDoc extends ComponentMeta {
  demo: Component
}

const demos: Record<string, Component> = {
  scrollbar: ScrollbarDemo,
  copy: CopyDemo,
  highlight: HighlightDemo,
  time: TimeDemo,
  'lazy-container': LazyContainerDemo,
  'resize-container': ResizeContainerDemo,
  'error-boundary': ErrorBoundaryDemo,
  'gradient-text': GradientTextDemo,
  'number-ticker': NumberTickerDemo,
  'sliding-highlight': SlidingHighlightDemo,
  'img-comparison-slider': ImgComparisonDemo,
  'slider-captcha': SliderCaptchaDemo,
  'command-menu': CommandMenuDemo,
  'context-menu': ContextMenuDemo,
  cropper: CropperDemo,
  'tiptap-editor': TiptapEditorDemo,
  'motion-group': MotionGroupDemo,
  gantt: GanttDemo,
  'file-viewer': FileViewerDemo,
  ellipsis: EllipsisDemo,
  permission: PermissionDemo,
  'count-down': CountDownDemo,
  loading: LoadingDemo,
  view: ViewDemo,
  exception: ExceptionDemo,
  ripple: RippleDemo,
  'code-editor': CodeEditorDemo,
  dock: DockDemo,
  'icon-picker': IconPickerDemo,
  'org-tree': OrgTreeDemo,
  'json-viewer': JsonViewerDemo,
  'search-panel': SearchPanelDemo,
}

export const componentDocs: ComponentDoc[] = componentMetas.map((meta) => ({
  ...meta,
  demo: demos[meta.slug]!,
}))

export { componentCategories }
export const docsByCategory = metasByCategory.map((category) => ({
  ...category,
  items: componentDocs.filter((doc) => doc.category === category.id),
}))
