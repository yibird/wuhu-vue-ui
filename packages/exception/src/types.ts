import type { StyleValue } from 'vue'

/** Built-in error presets. */
export type ExceptionType = 'badRequest' | 'forbidden' | 'notFound' | 'serverError' | 'networkError'

export type ExceptionClassValue =
  | string
  | Record<string, boolean>
  | (string | Record<string, boolean>)[]

/** Semantic class names for the exception parts. */
export interface ExceptionClasses {
  root?: ExceptionClassValue
  media?: ExceptionClassValue
  image?: ExceptionClassValue
  illustration?: ExceptionClassValue
  content?: ExceptionClassValue
  title?: ExceptionClassValue
  description?: ExceptionClassValue
  extra?: ExceptionClassValue
}

/** Semantic inline styles for the exception parts. */
export interface ExceptionStyles {
  root?: StyleValue
  media?: StyleValue
  image?: StyleValue
  illustration?: StyleValue
  content?: StyleValue
  title?: StyleValue
  description?: StyleValue
  extra?: StyleValue
}

export interface ExceptionProps {
  /** Error type. Controls the default illustration, title and description. */
  type?: ExceptionType
  /** Override the preset title. */
  title?: string
  /** Override the preset description. */
  description?: string
  /**
   * Custom banner image URL or data URI. When omitted, a built-in
   * illustration for `type` is rendered.
   */
  image?: string
  /** Hide the illustration / image area. */
  showImage?: boolean
  /** Semantic class names for the component parts. */
  classes?: ExceptionClasses
  /** Semantic inline styles for the component parts. */
  styles?: ExceptionStyles
}

export interface ExceptionSlotProps {
  type: ExceptionType
  title: string
  description: string
}
