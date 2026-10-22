import type { Component } from 'vue'

export type DockPosition = 'bottom' | 'top' | 'left' | 'right'

export interface DockItem {
  /** Stable identity for DOM reuse. Falls back to the array index. */
  id?: string | number
  /** Visible name, also used as the accessible label and default tooltip. */
  label: string
  /** Image URL or icon component. */
  icon?: string | Component
  /** Navigate to this URL when the item is activated without a `command`. */
  url?: string
  /** Target passed to `window.open` when `url` is set. Defaults to `_self`. */
  target?: string
  /** Prevent activation and pointer magnification. */
  disabled?: boolean
  /** Render a divider instead of an interactive item. */
  separator?: boolean
  /** Custom activation handler. Takes precedence over `url`. */
  command?: (item: DockItem, event: Event) => void
  /** Allow consumers to attach arbitrary metadata. */
  [key: string]: unknown
}

export interface DockProps {
  /** Items rendered in the dock. */
  model: DockItem[]
  /**
   * @desc 停靠位置，决定排列方向、放大原点与 Tooltip 方向
   * @default 'bottom'
   */
  position?: DockPosition
  /**
   * @desc 是否启用指针悬停放大
   * @default true
   */
  magnification?: boolean
  /**
   * @desc 每个图标的基准尺寸（px）
   * @default 48
   */
  baseSize?: number
  /**
   * @desc 放大后的最大缩放倍数
   * @default 1.6
   */
  maxScale?: number
  /**
   * @desc 项目之间的间距（px）
   * @default 8
   */
  gap?: number
  /** Accessible name for the dock. */
  ariaLabel?: string
}

export interface DockItemSlotProps {
  item: DockItem
  index: number
  active: boolean
}

export interface DockIconSlotProps {
  item: DockItem
}

export interface DockTooltipSlotProps {
  item: DockItem
}

export interface DockSlots {
  /** Replace the whole item content. */
  item?: (props: DockItemSlotProps) => unknown
  /** Replace the icon rendered inside an item. */
  icon?: (props: DockIconSlotProps) => unknown
  /** Replace the tooltip content. Rendered only while hovering. */
  tooltip?: (props: DockTooltipSlotProps) => unknown
}

export interface DockEmits {
  select: [item: DockItem, event: Event]
}
