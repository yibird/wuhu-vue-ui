import type { StyleValue } from 'vue'

/** Built-in size variants. */
export type EmptySize = 'sm' | 'md' | 'lg'

export type EmptyClassValue =
  | string
  | Record<string, boolean>
  | (string | Record<string, boolean>)[]

/** Semantic class names for the empty parts. */
export interface EmptyClasses {
  root?: EmptyClassValue
  image?: EmptyClassValue
  title?: EmptyClassValue
  description?: EmptyClassValue
  extra?: EmptyClassValue
}

/** Semantic inline styles for the empty parts. */
export interface EmptyStyles {
  root?: StyleValue
  image?: StyleValue
  title?: StyleValue
  description?: StyleValue
  extra?: StyleValue
}

export interface EmptyProps {
  /** Custom image URL. Rendered instead of the built-in illustration. */
  image?: string
  /** Main title text. */
  title?: string
  /** Optional description text. */
  description?: string
  /** Size variant. */
  size?: EmptySize
  /** Semantic class names for the component parts. */
  classes?: EmptyClasses
  /** Semantic inline styles for the component parts. */
  styles?: EmptyStyles
}

export interface EmptyImageSlotProps {
  title: string
}

export interface EmptyTitleSlotProps {
  title: string
}

export interface EmptyDescriptionSlotProps {
  title: string
  description: string
}
