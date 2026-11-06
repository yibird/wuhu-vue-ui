import type { StyleValue } from 'vue'

export type OrgTreeId = string | number

export type OrgTreeClassValue =
  | string
  | Record<string, boolean>
  | (string | Record<string, boolean>)[]

/** Semantic class names for the tree's internal parts. */
export interface OrgTreeClasses {
  root?: OrgTreeClassValue
  viewport?: OrgTreeClassValue
  canvas?: OrgTreeClassValue
  node?: OrgTreeClassValue
  card?: OrgTreeClassValue
  label?: OrgTreeClassValue
  toggle?: OrgTreeClassValue
  children?: OrgTreeClassValue
  menu?: OrgTreeClassValue
  menuItem?: OrgTreeClassValue
  empty?: OrgTreeClassValue
}

/** Semantic inline styles for the tree's internal parts. */
export interface OrgTreeStyles {
  root?: StyleValue
  viewport?: StyleValue
  canvas?: StyleValue
  node?: StyleValue
  card?: StyleValue
  label?: StyleValue
  toggle?: StyleValue
  children?: StyleValue
  menu?: StyleValue
  menuItem?: StyleValue
  empty?: StyleValue
}

export interface OrgTreeNode {
  id: OrgTreeId
  label: string
  children?: OrgTreeNode[]
  expand?: boolean
  disabled?: boolean
  [key: string]: unknown
}

/** Map logical fields to custom property names. */
export interface OrgTreeKeys {
  id?: string
  label?: string
  children?: string
}

export interface OrgTreeMenuItem {
  label: string
  command: string
  disabled?: boolean
}

export interface OrgTreeOffset {
  x?: number
  y?: number
}

export interface OrgTreeTranslate {
  x: number
  y: number
}

export interface OrgTreeDragPosition {
  x: number
  y: number
}

export interface OrgTreeDragEndEvent {
  node: OrgTreeNode
  /** New parent, `null` when the node became a root. */
  parent: OrgTreeNode | null
  canceled: boolean
  changed: boolean
}

export interface OrgTreeReparentEvent {
  id: OrgTreeId
  node: OrgTreeNode
  /** New parent, `null` when the node became a root. */
  parent: OrgTreeNode | null
  /** Parent before the drag, `null` for a root node. */
  previousParent: OrgTreeNode | null
}

export interface OrgTreeZoomEvent {
  scale: number
  translate: OrgTreeTranslate
}

export type OrgTreePanEvent = OrgTreeTranslate

export interface OrgTreeProps {
  data: OrgTreeNode | OrgTreeNode[]
  keys?: OrgTreeKeys
  horizontal?: boolean
  collapsable?: boolean
  defaultExpandLevel?: number
  defaultExpandKeys?: OrgTreeId[]
  /** Controlled expansion keys (`v-model:expandKeys`). */
  expandKeys?: OrgTreeId[]
  /** Controlled selection (`v-model:selectedKey`). */
  selectedKey?: OrgTreeId | null
  /** Enable canvas panning. */
  draggable?: boolean
  /** Enable wheel zooming. */
  scalable?: boolean
  /** When wheel zoom is allowed: always, only with Ctrl/Meta, or never. */
  wheelZoom?: 'always' | 'ctrl' | 'none'
  /** Enable dragging nodes onto other nodes to change their parent. */
  nodeDraggable?: boolean
  /**
   * Allow dropping a node on blank canvas to move it to the root level.
   * Defaults to `true`; set to `false` to ignore drops outside a node.
   */
  dropOnEmpty?: boolean
  /**
   * Mutate `data` on drag-reparent. Set to `false` for read-only/immutable
   * data and apply the `node-reparent` payload in the parent instead.
   */
  mutateData?: boolean
  disabled?: boolean
  /** Accessible name of the tree. Defaults to `组织架构图`. */
  ariaLabel?: string
  /** Accessible label of the expand button. Defaults to `展开`. */
  expandLabel?: string
  /** Accessible label of the collapse button. Defaults to `收起`. */
  collapseLabel?: string
  /** Only allow one root when dropping onto the canvas. */
  onlyOneNode?: boolean
  /** Center the tree on mount. */
  center?: boolean
  defaultScale?: number
  minScale?: number
  maxScale?: number
  defaultOffset?: OrgTreeOffset
  /** Return `false` to veto a reparent. May be async. */
  beforeDragEnd?: (dragNode: OrgTreeNode, dropNode: OrgTreeNode) => boolean | Promise<boolean>
  /** Menu items, or `false` to disable the context menu entirely. */
  contextMenu?: OrgTreeMenuItem[] | false
  emptyText?: string
  /** Root minimum height. Numbers are converted to pixels. */
  minHeight?: string | number
  /** Semantic class names for internal parts. */
  classes?: OrgTreeClasses
  /** Semantic inline styles for internal parts. */
  styles?: OrgTreeStyles
}

export interface OrgTreeNodeSlotProps {
  node: OrgTreeNode
  depth: number
  expanded: boolean
  toggle: () => void
}

export interface OrgTreeExpandSlotProps {
  node: OrgTreeNode
  expanded: boolean
  toggle: () => void
  hasChildren: boolean
}

export interface OrgTreeInstance {
  readonly scale: number
  readonly translate: OrgTreeTranslate
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
  fit: () => void
  center: () => void
  expandAll: () => void
  collapseAll: () => void
  scrollToNode: (id: OrgTreeId) => Promise<void>
  getNode: (id: OrgTreeId) => OrgTreeNode | undefined
}
