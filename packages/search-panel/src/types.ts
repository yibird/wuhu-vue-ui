import type { StyleValue, VNodeChild } from 'vue'
import type {
  CommandMenuClasses,
  CommandMenuEmptySlotProps,
  CommandMenuFilter,
  CommandMenuItem,
  CommandMenuItemSlotProps,
  CommandMenuKey,
  CommandMenuStyles,
} from '@wuhu-vue-ui/command-menu'

export type SearchPanelClassValue =
  | string
  | Record<string, boolean>
  | (string | Record<string, boolean>)[]

export interface SearchPanelClasses {
  overlay?: SearchPanelClassValue
  backdrop?: SearchPanelClassValue
  panel?: SearchPanelClassValue
  /** Wrapper rendered only when the `header` slot is used. */
  header?: SearchPanelClassValue
  /** Forwarded to the embedded CommandMenu parts (root, list, item, ...). */
  command?: CommandMenuClasses
  footer?: SearchPanelClassValue
}

export interface SearchPanelStyles {
  overlay?: StyleValue
  backdrop?: StyleValue
  panel?: StyleValue
  /** Wrapper rendered only when the `header` slot is used. */
  header?: StyleValue
  /** Forwarded to the embedded CommandMenu parts (root, list, item, ...). */
  command?: CommandMenuStyles
  footer?: StyleValue
}

export type SearchPanelCloseReason = 'escape' | 'backdrop' | 'select' | 'api'

export interface SearchPanelProps {
  /** Commands rendered by the underlying CommandMenu. */
  items: CommandMenuItem[]
  /** Selected command key. Supports `v-model:value`. */
  value?: CommandMenuKey
  /**
   * Controlled visibility. Omit for imperative internal state.
   * Supports `v-model:open`.
   */
  open?: boolean
  /** Forwarded to the header slot only; no default UI is rendered. */
  description?: string
  /** Forwarded to CommandMenu. */
  placeholder?: string
  /** Forwarded to CommandMenu. */
  emptyText?: string
  /** Forwarded to CommandMenu. */
  filterable?: boolean
  /** Forwarded to CommandMenu. */
  filter?: CommandMenuFilter
  /** Disable the panel and its shortcut. */
  disabled?: boolean
  /**
   * Global shortcut used to open the panel. `Mod` maps to Meta on Apple
   * platforms and Ctrl elsewhere. Pass `false` to disable it.
   */
  shortcut?: string | false
  /** Close after selecting a command. Defaults to true. */
  closeOnSelect?: boolean
  /** Panel width. Numbers are pixels. Defaults to 500. */
  width?: string | number
  /** Panel height. Numbers are pixels. Defaults to auto, capped by max-height. */
  height?: string | number
  /** Overlay stacking order. Defaults to 1001. */
  zIndex?: number | string
  /** Teleport target. Defaults to `'body'`. */
  to?: string | HTMLElement
  /** Semantic class names. */
  classes?: SearchPanelClasses
  /** Semantic inline styles. */
  styles?: SearchPanelStyles
}

export interface SearchPanelHeaderSlotProps {
  description?: string
  close: () => void
}

export interface SearchPanelFooterSlotProps {
  /** Formatted shortcut label, or null when shortcuts are disabled. */
  shortcutLabel: string | null
  close: () => void
}

export interface SearchPanelSlots {
  header?: (props: SearchPanelHeaderSlotProps) => VNodeChild
  item?: (props: CommandMenuItemSlotProps) => VNodeChild
  empty?: (props: CommandMenuEmptySlotProps) => VNodeChild
  footer?: (props: SearchPanelFooterSlotProps) => VNodeChild
}

export interface SearchPanelExpose {
  /** Request opening. In controlled mode this only emits `update:open`. */
  open: () => void
  close: (reason?: SearchPanelCloseReason) => void
  /** Focus the search input, or the panel when disabled. */
  focus: () => void
  readonly isOpen: boolean
}
