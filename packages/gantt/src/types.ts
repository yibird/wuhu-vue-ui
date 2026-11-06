import type { DateLike } from './utils/date'

export type GanttView = 'day' | 'week' | 'month'
export type GanttTaskId = string | number
export type GanttDragMode = 'move' | 'resize-start' | 'resize-end'

export interface GanttTask {
  id: GanttTaskId
  name: string
  /** Inclusive start date. Parsed as a calendar date. */
  start?: DateLike
  /** Inclusive end date. When omitted, equals start (or derives from children). */
  end?: DateLike
  /** Completion percentage from 0 to 100. Groups average their children when omitted. */
  progress?: number
  /** CSS color. Children inherit an explicit group color. */
  color?: string
  /** IDs of predecessor tasks. Arrows are drawn from each predecessor to this task. */
  dependencies?: GanttTaskId[]
  children?: GanttTask[]
  collapsed?: boolean
  milestone?: boolean
  disabled?: boolean
  /** Accessible name for the task bar. Defaults to `name` plus progress. */
  ariaLabel?: string
  assignee?: string
  /** Business-specific payload. Read it from slot props to render custom content. */
  meta?: Record<string, unknown>
}

export interface GanttRow {
  task: GanttTask
  key: string
  depth: number
  index: number
  start: Date
  end: Date
  progress: number
  color: string
  hasChildren: boolean
  expanded: boolean
  parentKey: string | null
}

export interface GanttProps {
  /** Hierarchical task data. */
  tasks: GanttTask[]
  /** Timeline density. */
  view?: GanttView
  /** Explicit range start. When omitted it is derived from tasks. */
  startDate?: DateLike
  /** Explicit range end (inclusive). When omitted it is derived from tasks. */
  endDate?: DateLike
  /** Root height. Numbers are converted to pixels. */
  height?: string | number
  /** Width of the task list. */
  sidebarWidth?: number
  rowHeight?: number
  taskHeight?: number
  /** Override the pixels per calendar day for the selected view. */
  dayWidth?: number
  /** Padding around auto-calculated task dates, in calendar days. */
  rangePadding?: number
  /**
   * Safety limit for the rendered date range. Defaults to 730 days (~2 years)
   * to prevent accidental multi-year day-level rendering. Set to 0 to disable
   * the limit; prefer the week/month view or a smaller explicit range for long
   * schedules.
   */
  maxRangeDays?: number
  readonly?: boolean
  draggable?: boolean
  resizable?: boolean
  selectable?: boolean
  showProgress?: boolean
  showToday?: boolean
  showWeekends?: boolean
  showDependencies?: boolean
  defaultExpandAll?: boolean
  /** 0 = Sunday, 1 = Monday. */
  weekStartsOn?: number
  locale?: string
  selected?: GanttTaskId | null
  loading?: boolean
  /** Scroll the visible timeline to today after mounting. */
  scrollToToday?: boolean
  ariaLabel?: string
  /** Accessible label of the expand button. Defaults to `展开`. */
  expandLabel?: string
  /** Accessible label of the collapse button. Defaults to `收起`. */
  collapseLabel?: string
  taskHeaderText?: string
  todayText?: string
  emptyText?: string
  progressText?: string
  /**
   * Items shown when a task row or bar is right-clicked. A function receives
   * the current task, so the menu can depend on task state.
   */
  contextMenuItems?: GanttContextMenuItems
}

export interface GanttContextMenuItem {
  /** Stable key used for rendering and selection. */
  key: string
  /** Item text. Optional only for separators. */
  label?: string
  /** Render a separator instead of a clickable item. */
  divider?: boolean
  disabled?: boolean
  /** Render the item with the danger color. */
  danger?: boolean
  /** Optional shortcut hint shown on the right. */
  shortcut?: string
}

export type GanttContextMenuItems =
  | GanttContextMenuItem[]
  | ((task: GanttTask) => GanttContextMenuItem[])

export interface GanttContextMenuSelectEvent {
  item: GanttContextMenuItem
  task: GanttTask
  row: GanttRow
}

export interface GanttContextMenuSlotProps {
  task: GanttTask
  row: GanttRow
  /** Close the menu without emitting a selection. */
  close: () => void
  /** Emit `context-menu-select` for an item and close the menu. */
  select: (item: GanttContextMenuItem) => void
}

export interface GanttTaskUpdateEvent {
  task: GanttTask
  mode: GanttDragMode
  start: Date
  end: Date
  previousStart: Date
  previousEnd: Date
}

export interface GanttTaskDragEvent {
  task: GanttTask
  mode: GanttDragMode
  start: Date
  end: Date
}

export interface GanttDragEndEvent extends GanttTaskDragEvent {
  canceled: boolean
  changed: boolean
}

export interface GanttScrollEvent {
  scrollTop: number
  scrollLeft: number
}

export interface GanttSidebarSlotProps {
  task: GanttTask
  row: GanttRow
  depth: number
  expanded: boolean
  toggle: () => void
}

export interface GanttTaskSlotProps {
  task: GanttTask
  row: GanttRow
  start: Date
  end: Date
  progress: number
  color: string
  dragging: boolean
}

export interface GanttTooltipSlotProps {
  task: GanttTask
  row: GanttRow
  start: Date
  end: Date
  progress: number
}

export interface GanttToolbarSlotProps {
  view: GanttView
  startDate: Date
  endDate: Date
  scrollToToday: () => void
  scrollToTask: (id: GanttTaskId) => void
}

export interface GanttEmptySlotProps {
  view: GanttView
  startDate: Date
  endDate: Date
}

export interface GanttInstance {
  readonly rows: GanttRow[]
  readonly scrollRef: HTMLElement | undefined
  scrollToDate: (
    value: DateLike,
    options?: { align?: 'start' | 'center' | 'end'; behavior?: ScrollBehavior },
  ) => void
  scrollToToday: () => void
  scrollToTask: (id: GanttTaskId) => Promise<void>
  getTaskById: (id: GanttTaskId) => GanttTask | undefined
}
