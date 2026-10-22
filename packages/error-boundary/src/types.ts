import type { ComponentPublicInstance } from 'vue'

export interface ErrorBoundaryProps {
  /** Root element tag. */
  tag?: string
  /** Title used by the default fallback. */
  title?: string
  /** Custom description used by the default fallback. */
  description?: string
  /** Show the raw error message in the default fallback. */
  showDetails?: boolean
  /** Show the default reset button. */
  showReset?: boolean
  /** Label for the default reset button. */
  resetText?: string
  /** Let the error continue propagating to a parent boundary or errorHandler. */
  propagate?: boolean
  /** Reset the boundary automatically whenever this value changes. */
  resetOn?: unknown
}

export interface ErrorBoundaryErrorEvent {
  error: unknown
  info: string
  instance: ComponentPublicInstance | null
}

export interface ErrorBoundarySlotProps {
  error: unknown
  info: string
  instance: ComponentPublicInstance | null
  reset: () => void
}
