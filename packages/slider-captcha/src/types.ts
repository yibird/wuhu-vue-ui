import type { StyleValue } from 'vue'

export type SliderCaptchaClassValue =
  | string
  | Record<string, boolean>
  | (string | Record<string, boolean>)[]

/** Semantic class names for the slider captcha parts. */
export interface SliderCaptchaClasses {
  root?: SliderCaptchaClassValue
  image?: SliderCaptchaClassValue
  canvas?: SliderCaptchaClassValue
  piece?: SliderCaptchaClassValue
  refresh?: SliderCaptchaClassValue
  loading?: SliderCaptchaClassValue
  slider?: SliderCaptchaClassValue
  fill?: SliderCaptchaClassValue
  tip?: SliderCaptchaClassValue
  handle?: SliderCaptchaClassValue
  live?: SliderCaptchaClassValue
}

/** Semantic inline styles for the slider captcha parts. */
export interface SliderCaptchaStyles {
  root?: StyleValue
  image?: StyleValue
  canvas?: StyleValue
  piece?: StyleValue
  refresh?: StyleValue
  loading?: StyleValue
  slider?: StyleValue
  fill?: StyleValue
  tip?: StyleValue
  handle?: StyleValue
  live?: StyleValue
}

export interface SliderCaptchaTarget {
  /** Horizontal position of the puzzle cutout, in image pixels. */
  x: number
  /** Vertical position of the puzzle cutout, in image pixels. */
  y: number
}

export interface SliderCaptchaProps {
  /** Background image URL. When omitted, a generated gradient artwork is used. */
  src?: string
  /** Captcha image width in pixels. */
  width?: number
  /** Captcha image height in pixels. */
  height?: number
  /** Size of the square part of the puzzle piece, in pixels. */
  pieceSize?: number
  /** Allowed horizontal error in pixels when validating. */
  tolerance?: number
  /** Disable dragging, keyboard navigation and validation. */
  disabled?: boolean
  /** `crossorigin` attribute used while loading `src`. */
  crossOrigin?: '' | 'anonymous' | 'use-credentials'
  /** Instruction shown on the slider track. */
  text?: string
  /** Status text after a successful validation. */
  successText?: string
  /** Status text after a failed validation. */
  failText?: string
  /** Status text while the background image is loading. */
  loadingText?: string
  /** Automatically generate a new challenge after a failed attempt. */
  refreshOnFail?: boolean
  /** Accessible name for the captcha region and slider. */
  ariaLabel?: string
  /** Accessible label of the refresh button. Defaults to `换一张验证码`. */
  refreshLabel?: string
  /** Semantic class names for the component parts. */
  classes?: SliderCaptchaClasses
  /** Semantic inline styles for the component parts. */
  styles?: SliderCaptchaStyles
}

export interface SliderCaptchaSuccessEvent {
  /** Final slider offset. */
  offset: number
  /** Target cutout position. */
  target: SliderCaptchaTarget
  /** Time spent between the first interaction and validation, in milliseconds. */
  duration: number
  /** Number of validation attempts in the current challenge. */
  attempts: number
}

export interface SliderCaptchaFailEvent {
  offset: number
  target: SliderCaptchaTarget
  duration: number
  attempts: number
}
