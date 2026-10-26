import { shallowReactive } from 'vue'
import type { ExceptionType } from './types'

/** Content overrides for a built-in error type. */
export interface ExceptionPreset {
  /** Banner image URL or data URI. Replaces the built-in illustration. */
  image?: string
  /** Title shown for this error type. */
  title?: string
  /** Description shown for this error type. */
  description?: string
}

export type ExceptionPresets = Partial<Record<ExceptionType, ExceptionPreset>>

const globalPresets = shallowReactive<ExceptionPresets>({})

/**
 * Globally override the image, title and description of built-in error types.
 * Each call replaces the previous global configuration; omitted types fall
 * back to the built-in presets. Per-instance props and slots still win.
 */
export function setExceptionPresets(presets: ExceptionPresets): void {
  for (const type of Object.keys(globalPresets) as ExceptionType[]) {
    delete globalPresets[type]
  }

  for (const type of Object.keys(presets) as ExceptionType[]) {
    const preset = presets[type]
    if (preset) globalPresets[type] = { ...preset }
  }
}

export function getExceptionPreset(type: ExceptionType): ExceptionPreset | undefined {
  return globalPresets[type]
}
