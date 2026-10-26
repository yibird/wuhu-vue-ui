import type { StyleValue, VNodeChild } from 'vue'

export type SlidingHighlightClassValue =
  | string
  | Record<string, boolean>
  | (string | Record<string, boolean>)[]

/** Semantic class names for the sliding highlight parts. */
export interface SlidingHighlightClasses {
  /** Class names for the positioning container. */
  container?: SlidingHighlightClassValue
  /** Class names for the highlight pill. */
  pill?: SlidingHighlightClassValue
}

/** Semantic inline styles for the sliding highlight parts. */
export interface SlidingHighlightStyles {
  /** Inline styles for the positioning container. */
  container?: StyleValue
  /** Inline styles for the highlight pill. */
  pill?: StyleValue
}

/**
 * 高亮块相对容器左上角的几何信息
 */
export interface SlidingHighlightRect {
  x: number
  y: number
  width: number
  height: number
}

export interface SlidingHighlightProps {
  /**
   * @desc 子项使用的语义化容器标签，传入 `ul` 时高亮块会渲染为 `li`，保证列表语义合法
   * @default 'div'
   */
  as?: 'div' | 'ul'
  /**
   * @desc 高亮块相对每个子项的横向外扩距离（px），正值向外扩张
   * @default 20
   */
  inset?: number
  /** Semantic class names for the positioning container and highlight pill. */
  classes?: SlidingHighlightClasses
  /** Semantic inline styles for the positioning container and highlight pill. */
  styles?: SlidingHighlightStyles
}

export interface SlidingHighlightSlots {
  /**
   * @desc 列表内容，悬浮其中的直接子元素时高亮块会跟随移动
   */
  default?: () => VNodeChild
}

export interface SlidingHighlightInstance {
  /**
   * @desc 高亮指定子项，用于键盘导航等非指针场景
   */
  highlight: (element: HTMLElement) => void
  /**
   * @desc 清除高亮
   */
  clear: () => void
}
