import type { HTMLAttributes, StyleValue, VNode } from 'vue'

/** Class value accepted by the semantic `classes` APIs. */
export type ViewClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[]

export interface ViewClasses {
  /** Root layout element. */
  root?: ViewClassValue
}

export interface ViewStyles {
  /** Root layout element. */
  root?: StyleValue
}

export interface ViewCollapsibleClasses {
  root?: ViewClassValue
  body?: ViewClassValue
  content?: ViewClassValue
  trigger?: ViewClassValue
  triggerButton?: ViewClassValue
  triggerIcon?: ViewClassValue
}

export interface ViewCollapsibleStyles {
  root?: StyleValue
  body?: StyleValue
  content?: StyleValue
  trigger?: StyleValue
  triggerButton?: StyleValue
  triggerIcon?: StyleValue
}

/**
 * View 组件尺寸，数字按像素处理
 */
export type ViewSize = number | string
/**
 * 子元素排列方向
 */
export type ViewDirection = 'vertical' | 'horizontal'

export interface ViewProps extends /* @vue-ignore */ HTMLAttributes {
  /**
   * @desc 是否占满整个容器
   * @default true
   */
  full?: boolean
  /**
   * @desc 子元素之间的间距，默认 0。View 始终作为 flex 容器。
   */
  gap?: ViewSize
  /**
   * @desc 子元素排列方向。
   * @default 'vertical'
   */
  direction?: ViewDirection
  /** Semantic class names. */
  classes?: ViewClasses
  /** Semantic inline styles. */
  styles?: ViewStyles
}

export interface ViewSlots {
  /**
   * @desc 布局内容
   */
  default?: () => VNode | VNode[]
}

export interface ViewCollapsePayload {
  /**
   * @desc 收缩状态
   */
  collapsed: boolean
  /**
   * @desc 切换收缩状态
   */
  toggle: () => void
}

export interface ViewCollapsibleProps {
  /**
   * @desc 是否允许用户通过 trigger 控制内容折叠
   * @default false
   */
  collapsible?: boolean
  /**
   * @desc 是否显示内置或自定义 trigger
   * @default true
   */
  trigger?: boolean
  /**
   * @desc 当前是否处于收起状态
   * @default false
   */
  collapsed?: boolean
}
export interface ViewSiderProps extends /* @vue-ignore */ HTMLAttributes, ViewCollapsibleProps {
  /**
   * @desc 展开状态下的宽度
   * @default 240
   */
  width?: ViewSize
  /**
   * @desc 收起状态下的宽度，设置为 0 时会完全收起内容
   * @default 0
   */
  collapsedWidth?: ViewSize
  /** Semantic class names. */
  classes?: ViewCollapsibleClasses
  /** Semantic inline styles. */
  styles?: ViewCollapsibleStyles
}

export interface ViewHeaderProps extends /* @vue-ignore */ HTMLAttributes, ViewCollapsibleProps {
  /** Semantic class names. */
  classes?: ViewCollapsibleClasses
  /** Semantic inline styles. */
  styles?: ViewCollapsibleStyles
}

/**
 * ViewContent 属性类型，继承原生 HTML 属性
 */
export type ViewContentProps = HTMLAttributes

/**
 * ViewFooter 属性类型，继承原生 HTML 属性
 */
export type ViewFooterProps = HTMLAttributes

export interface ViewSiderSlots {
  /**
   * @desc 侧栏内容
   */
  default?: (props: { collapsed: boolean }) => VNode | VNode[]
  /**
   * @desc 自定义折叠触发器
   */
  trigger?: (props: ViewCollapsePayload) => VNode | VNode[]
}

export interface ViewHeaderSlots {
  /**
   * @desc 头部内容
   */
  default?: (props: { collapsed: boolean }) => VNode | VNode[]
  /**
   * @desc 自定义折叠触发器
   */
  trigger?: (props: ViewCollapsePayload) => VNode | VNode[]
}

export interface ViewCollapseEmits {
  /**
   * @desc 收起状态变化事件
   */
  collapse: [collapsed: boolean]
}
