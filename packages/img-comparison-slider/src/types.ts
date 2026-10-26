import type { StyleValue } from 'vue'

export type ComparisonDirection = 'horizontal' | 'vertical'

export type ComparisonClassValue =
  | string
  | Record<string, boolean>
  | (string | Record<string, boolean>)[]

/** Semantic class names for the slider parts. */
export interface ImgComparisonSliderClasses {
  root?: ComparisonClassValue
  before?: ComparisonClassValue
  after?: ComparisonClassValue
  image?: ComparisonClassValue
  label?: ComparisonClassValue
  beforeLabel?: ComparisonClassValue
  afterLabel?: ComparisonClassValue
  handle?: ComparisonClassValue
  line?: ComparisonClassValue
  knob?: ComparisonClassValue
}

/** Semantic inline styles for the slider parts. */
export interface ImgComparisonSliderStyles {
  root?: StyleValue
  before?: StyleValue
  after?: StyleValue
  image?: StyleValue
  label?: StyleValue
  beforeLabel?: StyleValue
  afterLabel?: StyleValue
  handle?: StyleValue
  line?: StyleValue
  knob?: StyleValue
}

/**
 * Pointer gestures that start inside `before` / `after` slot content are
 * ignored when the target matches `a`, `button`, `input`, `select`, `textarea`,
 * `[role="button"]` or `[contenteditable]`. Add `data-w-comparison-ignore` to
 * any other element that should keep its own pointer behavior and focus.
 */
export interface ImgComparisonSliderProps {
  /** Accessible name of the slider. Defaults to `图片对比滑块`. */
  ariaLabel?: string
  /** Position of the divider, as a percentage from 0 to 100. Supports v-model. */
  modelValue?: number
  /** Before image URL. Can be replaced by the `before` slot. */
  before?: string
  /** After image URL. Can be replaced by the `after` slot. */
  after?: string
  altBefore?: string
  altAfter?: string
  /** Horizontal moves left/right; vertical moves top/bottom. */
  direction?: ComparisonDirection
  /** Disable mouse, touch and keyboard interaction. */
  disabled?: boolean
  showLabels?: boolean
  beforeLabel?: string
  afterLabel?: string
  /** CSS aspect-ratio value. Set to "auto" when the container has a fixed height. */
  aspectRatio?: string | number
  /** Keyboard arrow increment, as a percentage. */
  keyboardStep?: number
  /** Semantic class names for the slider parts. */
  classes?: ImgComparisonSliderClasses
  /** Semantic inline styles for the slider parts. */
  styles?: ImgComparisonSliderStyles
}

export interface ImgComparisonSliderSlotProps {
  position: number
  direction: ComparisonDirection
}

export interface ImgComparisonSliderEmits {
  'update:modelValue': [value: number]
  /** Emitted continuously while dragging. */
  change: [value: number]
  dragstart: [value: number]
  dragend: [value: number]
  error: [side: 'before' | 'after', event: Event]
}
