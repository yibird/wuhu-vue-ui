import type { StyleValue, VNode } from 'vue'

export type ContextMenuKey = string | number

/** Class value accepted by the semantic `classes` APIs. */
export type ContextMenuClassValue =
  | string
  | Record<string, boolean>
  | (string | Record<string, boolean>)[]

export interface ContextMenuClasses {
  /** Menu panel. */
  root?: ContextMenuClassValue
  /** Every actionable item. */
  item?: ContextMenuClassValue
  /** Icon wrapper inside an item. */
  icon?: ContextMenuClassValue
  /** Label inside an item. */
  label?: ContextMenuClassValue
  /** Suffix slot at the end of an item. */
  suffix?: ContextMenuClassValue
  /** Group heading. */
  groupLabel?: ContextMenuClassValue
  /** Separator line. */
  separator?: ContextMenuClassValue
}

export interface ContextMenuStyles {
  root?: StyleValue
  item?: StyleValue
  icon?: StyleValue
  label?: StyleValue
  suffix?: StyleValue
  groupLabel?: StyleValue
  separator?: StyleValue
}

export interface ContextMenuActionItem {
  /** Defaults to `'item'`. */
  type?: 'item'
  /** Stable, unique identifier. */
  key: ContextMenuKey
  label: string
  /** Leading virtual node, rendered inside a fixed-size icon slot. */
  icon?: VNode
  /** Trailing virtual node, rendered on the right side of the item. */
  suffix?: VNode
  disabled?: boolean
  danger?: boolean
}

export interface ContextMenuHeaderItem {
  type: 'header'
  key?: ContextMenuKey
  label: string
}

export interface ContextMenuSeparatorItem {
  type: 'separator'
  key?: ContextMenuKey
}

export type ContextMenuItem =
  | ContextMenuActionItem
  | ContextMenuHeaderItem
  | ContextMenuSeparatorItem

/**
 * Items can be provided directly or lazily resolved once per opening.
 */
export type ContextMenuItems = ContextMenuItem[] | (() => ContextMenuItem[])

export interface ContextMenuOpenDetails {
  /** Clamped viewport coordinates. */
  x: number
  y: number
}

export interface ContextMenuSelectDetails {
  item: ContextMenuItem
}

export interface ContextMenuProps {
  /** Actions, group headings and separators. */
  items?: ContextMenuItems
  /** Controlled visibility. Omit for imperative internal state. */
  open?: boolean
  /** Close after selecting an action. Defaults to true. */
  closeOnSelect?: boolean
  /** Restore focus on Escape, selection and Tab. Defaults to true. */
  restoreFocus?: boolean
  /** Accessible name of the menu panel. Defaults to `上下文菜单`. */
  ariaLabel?: string
  /** Semantic class names. */
  classes?: ContextMenuClasses
  /** Semantic inline styles. */
  styles?: ContextMenuStyles
}

export interface ContextMenuExpose {
  /**
   * Open at the pointer coordinates of a mouse event. Native menu is
   * preserved (no `preventDefault`) when the menu cannot open.
   */
  open: (event: MouseEvent) => boolean
  close: () => void
  /** Focus the first enabled item, or the panel when none is enabled. */
  focus: () => void
  readonly isOpen: boolean
}
