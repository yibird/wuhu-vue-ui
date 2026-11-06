import type { Ref, StyleValue, VNodeChild } from 'vue'

export type LoadingAnimation = 'bars' | 'beat' | 'pulse' | 'ring' | 'spinner'

export type LoadingGradient = boolean | string | readonly string[]

export type LoadingClassValue =
  | string
  | Record<string, boolean>
  | (string | Record<string, boolean>)[]

/** Semantic class names for the loading parts. */
export interface LoadingClasses {
  root?: LoadingClassValue
  content?: LoadingClassValue
  indicator?: LoadingClassValue
  title?: LoadingClassValue
  description?: LoadingClassValue
}

/** Semantic inline styles for the loading parts. */
export interface LoadingStyles {
  root?: StyleValue
  content?: StyleValue
  indicator?: StyleValue
  title?: StyleValue
  description?: StyleValue
}

export interface LoadingProps {
  /** Built-in animation. Defaults to `ring`. */
  animation?: LoadingAnimation
  /** Render a fixed fullscreen overlay. */
  full?: boolean
  /** Controls visibility. Supports `v-model:open`. */
  open?: boolean
  /** Size of the animation box. Numbers are pixels. */
  size?: string | number
  /** Primary animation color. Defaults to the theme primary color. */
  color?: string
  /**
   * Background gradient for the loading container (not the animation shapes).
   * - `true` uses a corner radial highlight plus a subtle primary-tinted linear wash.
   * - A string is used directly as the CSS background.
   * - An array becomes a `135deg` linear gradient.
   */
  gradient?: LoadingGradient
  /** Title rendered below the animation. */
  title?: string
  /** Description rendered below the title. */
  description?: string
  /** Show the fullscreen mask. Defaults to true. */
  mask?: boolean
  /** Fullscreen overlay z-index. Defaults to 2000. */
  zIndex?: number
  /** Teleport target used by the fullscreen overlay. Defaults to `body`. */
  teleport?: string | HTMLElement
  /** Semantic class names for the loading parts. */
  classes?: LoadingClasses
  /** Semantic inline styles for the loading parts. */
  styles?: LoadingStyles
}

export interface LoadingSlots {
  /** Replaces the built-in animation. */
  default?: () => VNodeChild
  title?: () => VNodeChild
  description?: () => VNodeChild
}

export interface LoadingOptions extends LoadingProps {
  /** Called when `close()` is invoked on an imperative instance. */
  onClose?: () => void
  /** Slots for an imperative instance. */
  slots?: LoadingSlots
}

export interface LoadingInstance {
  id: number
  /** Hide and remove the instance. */
  close: () => void
  /** Merge new options into the instance. */
  update: (options: Partial<LoadingOptions>) => void
  /** Remove the instance immediately. */
  destroy: () => void
}

export interface UseLoadingReturn {
  visible: Readonly<Ref<boolean>>
  open: () => void
  close: () => void
  toggle: () => void
}
