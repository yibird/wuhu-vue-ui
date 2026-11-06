import type { VNode } from 'vue'

/**
 * An icon can be a CSS class name (rendered on an `<i>` element) or a
 * ready-to-render Vue VNode.
 */
export type IconPickerIcon = string | VNode

export interface IconPickerItem {
  /** Unique key across every group. */
  key: string
  /** Label shown below the icon and used for searching. */
  label: string
  /** Class name or VNode used to render the glyph. */
  icon: IconPickerIcon
}

export interface IconPickerGroup {
  /** Stable group key used for selection. */
  key: string
  /** Group label shown in the sidebar. */
  label: string
  items: IconPickerItem[]
}

export interface IconPickerProps {
  /** Grouped icon data. Empty groups are hidden automatically. */
  items: IconPickerGroup[]
  /** Selected icon key. Supports `v-model`. */
  modelValue?: string | null
  /** Show the search field. Defaults to `true`. */
  showSearch?: boolean
  /** Search placeholder and accessible name. */
  placeholder?: string
  /** Shown when filtering produces no results. */
  emptyText?: string
  /** Label of the "all icons" entry. */
  allLabel?: string
  /** Heading above the group list. */
  groupsLabel?: string
  /** Sidebar heading. Defaults to `图标库`. */
  libraryLabel?: string
  /** Formats the result count in the header. Defaults to `n 个`. */
  countLabel?: (count: number) => string
  /** Accessible name of the picker. */
  ariaLabel?: string
  /** Accessible label of the clear-search button. Defaults to `清除搜索`. */
  clearSearchLabel?: string
  /** Fixed column count. When omitted, columns fit `itemMinWidth`. */
  columns?: number
  /** Minimum item width used to compute the column count. */
  itemMinWidth?: number
  /** Height of one grid item, in pixels. */
  itemHeight?: number
  /** Height of the picker. Numbers are pixels. */
  height?: string | number
  /** Extra rows rendered above and below the viewport. */
  overscan?: number
  /** Disable selection. */
  disabled?: boolean
}

export interface IconPickerEmits {
  'update:modelValue': [key: string | null]
  select: [item: IconPickerItem, group: IconPickerGroup]
}

export interface IconPickerSlots {
  /** Replace the empty-result content. */
  empty?: () => unknown
}
