import type { CodeEditorInstance, CodeEditorProps } from '@wuhu-ui/code-editor'

export interface JsonViewerProps {
  /** JSON value or a JSON string to display. */
  value: unknown
  /** Container height. Numbers are treated as pixels. */
  height?: string | number
  /** Container width. Numbers are treated as pixels. */
  width?: string | number
  /** Monaco theme identifier, e.g. `vs` or `vs-dark`. */
  theme?: string
  /** Number of spaces used for indentation, from 0 to 10. */
  indent?: number
  /** Options forwarded to Monaco. Read-only flags cannot be overridden. */
  options?: CodeEditorProps['options']
  /** Text shown while Monaco is loading. */
  loadingText?: string
}

export interface JsonViewerErrorSlotProps {
  error: Error
  retry: () => void
}

export interface JsonViewerExpose {
  getEditor: () => CodeEditorInstance | null
  focus: () => void
  layout: () => void
  /** Current value read from the editor. */
  getValue: () => string
  /** Formatted JSON computed from the current `value` prop. */
  getFormattedValue: () => string
}
