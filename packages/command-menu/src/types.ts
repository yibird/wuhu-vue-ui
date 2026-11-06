import type { Component, StyleValue } from 'vue'

export type CommandMenuKey = string | number

export type CommandMenuClassValue =
  | string
  | Record<string, boolean>
  | (string | Record<string, boolean>)[]

/** Semantic class names for the menu's internal parts. */
export interface CommandMenuClasses {
  root?: CommandMenuClassValue
  search?: CommandMenuClassValue
  input?: CommandMenuClassValue
  clear?: CommandMenuClassValue
  list?: CommandMenuClassValue
  group?: CommandMenuClassValue
  groupLabel?: CommandMenuClassValue
  item?: CommandMenuClassValue
  empty?: CommandMenuClassValue
}

/** Semantic inline styles for the menu's internal parts. */
export interface CommandMenuStyles {
  root?: StyleValue
  search?: StyleValue
  input?: StyleValue
  clear?: StyleValue
  list?: StyleValue
  group?: StyleValue
  groupLabel?: StyleValue
  item?: StyleValue
  empty?: StyleValue
}

/**
 * Icons follow the component library's inline-SVG convention: pass a Vue
 * component (its root will receive sizing/colour from the menu) or a short
 * text glyph for simple cases.
 */
export type CommandMenuIcon = Component | string

export type CommandMenuEscapeBehavior = 'clear' | 'close' | 'none'

export interface CommandMenuItem {
  /** Stable, unique identifier used for selection and `v-model`. */
  key: CommandMenuKey
  /** Primary text displayed and searched. */
  label: string
  /** Optional supporting text displayed below the label and searched. */
  description?: string
  /** Optional group name. Items sharing a group are rendered together. */
  group?: string
  /** Optional icon component or short text glyph. */
  icon?: CommandMenuIcon
  /** Extra search terms (aliases, translations, pinyin, etc.). */
  keywords?: string[]
  /** Keyboard shortcut hint. Purely presentational. */
  shortcut?: string
  /** Disabled items are rendered but skipped by navigation and selection. */
  disabled?: boolean
}

/** Custom matcher invoked with the normalized (trimmed, lowercased) query. */
export type CommandMenuFilter = (item: CommandMenuItem, query: string) => boolean

export interface CommandMenuProps {
  /** Commands to display. The array is never mutated. */
  items: CommandMenuItem[]
  /** Currently selected item key. Supports `v-model`. */
  modelValue?: CommandMenuKey
  /** Search input placeholder. */
  placeholder?: string
  /** Message shown when filtering yields no items. */
  emptyText?: string
  /** Focus the search input after mounting. */
  autoFocus?: boolean
  /** Filter items as the user types. When false, every item stays visible. */
  filterable?: boolean
  /**
   * Custom matcher for the normalized (trimmed, lowercased) query. Return
   * `true` to keep the item. When omitted, the label, description and keywords
   * are matched with case-insensitive substring search.
   */
  filter?: CommandMenuFilter
  /** Disable search, navigation and selection. */
  disabled?: boolean
  /**
   * What Escape does:
   * - `clear`: clear the current query (no-op when already empty).
   * - `close`: emit `close` so the host can hide the panel.
   * - `none`: leave the key to the host application.
   */
  escapeBehavior?: CommandMenuEscapeBehavior
  /** Maximum height of the scrollable result list. Numbers are pixels. */
  maxHeight?: string | number
  /** Accessible name for the search input and result list. */
  ariaLabel?: string
  /** Accessible name and tooltip for the clear-search button. */
  clearLabel?: string
  /** Semantic class names for the menu's internal parts. */
  classes?: CommandMenuClasses
  /** Semantic inline styles for the menu's internal parts. */
  styles?: CommandMenuStyles
}

/** Slot props for customizing a single command row. */
export interface CommandMenuItemSlotProps {
  item: CommandMenuItem
  /** Zero-based index in the current visible result list. */
  index: number
  /** Whether the row is the keyboard/pointer active row. */
  active: boolean
  /** Whether the row matches `v-model`. */
  selected: boolean
  disabled: boolean
  /** Selects this row and emits `update:modelValue` / `select`. */
  select: () => void
}

/** Slot props for the empty result state. */
export interface CommandMenuEmptySlotProps {
  /** Current raw search query. */
  query: string
}
