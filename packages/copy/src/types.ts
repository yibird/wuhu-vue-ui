export interface CopyProps {
  /** Resolve the text to copy. May return a string or a promise. */
  text?: () => string | Promise<string>
  /** Disable the copy trigger. */
  disabled?: boolean
  /** Accessible label for the icon trigger. Defaults to `复制`. */
  ariaLabel?: string
  /** How long the copied state is shown, in milliseconds. */
  duration?: number
  /**
   * Show the copy / success icon. Defaults to `true`.
   * When enabled, only the icon triggers copying; prefix / suffix content
   * stays non-interactive.
   */
  showIcon?: boolean
}

export interface CopySlotProps {
  copied: boolean
  loading: boolean
  error: Error | null
  /** Whether the current environment can copy to the clipboard. */
  isSupported: boolean
  copy: () => Promise<boolean>
}
