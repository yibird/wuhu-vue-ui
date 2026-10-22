import type { CSSProperties } from 'vue'

export interface HighlightProps {
  /** The plain text to highlight. Rendered as text nodes, never as HTML. */
  text?: string
  /** One or more keywords. Longer keywords win when they overlap. */
  keywords?: string | string[]
  /** Match case-sensitively. Defaults to false. */
  caseSensitive?: boolean
  /** Only match full words. Uses Unicode-aware letter/number boundaries. */
  wholeWord?: boolean
  /** Tag used for matched segments. Defaults to `mark`. */
  tag?: string
  /** Extra class applied to every matched segment. */
  highlightClass?: string
  /** Inline styles applied to every matched segment. */
  highlightStyle?: CSSProperties | CSSProperties[]
}

export interface HighlightSegment {
  text: string
  matched: boolean
  keyword?: string
}

export interface HighlightSlotProps {
  text: string
  keyword: string | undefined
  index: number
  segment: HighlightSegment
}
