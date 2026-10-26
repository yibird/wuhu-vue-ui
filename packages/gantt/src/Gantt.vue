<script setup lang="ts">
import {
  clampToViewport,
  useControllableState,
  useDismissable,
  useIntervalFn,
  useListNavigation,
  usePointerDrag,
  useRaf,
} from '@wuhu-vue-ui/core'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useId,
  useSlots,
  watch,
  type CSSProperties,
} from 'vue'
import type {
  GanttContextMenuItem,
  GanttContextMenuSelectEvent,
  GanttContextMenuSlotProps,
  GanttDragEndEvent,
  GanttDragMode,
  GanttEmptySlotProps,
  GanttProps,
  GanttRow,
  GanttScrollEvent,
  GanttSidebarSlotProps,
  GanttTask,
  GanttTaskDragEvent,
  GanttTaskId,
  GanttTaskSlotProps,
  GanttTaskUpdateEvent,
  GanttToolbarSlotProps,
  GanttTooltipSlotProps,
  GanttView,
} from './types'
import { colorWithAlpha } from './utils/color'
import {
  addDays,
  dayDiff,
  eachDay,
  endOfMonth,
  isSameDay,
  isWeekend,
  maxDate,
  minDate,
  parseDate,
  startOfDay,
  startOfMonth,
  startOfWeek,
  type DateLike,
} from './utils/date'
import { resolveTasks, taskKey, type ResolvedTask } from './utils/tasks'

defineOptions({
  name: 'WGantt',
})

const props = withDefaults(defineProps<GanttProps>(), {
  view: 'day',
  height: '600px',
  sidebarWidth: 280,
  rowHeight: 44,
  taskHeight: 24,
  rangePadding: 3,
  maxRangeDays: 3660,
  readonly: false,
  draggable: true,
  resizable: true,
  selectable: true,
  showProgress: true,
  showToday: true,
  showWeekends: true,
  showDependencies: true,
  defaultExpandAll: true,
  weekStartsOn: 1,
  locale: 'zh-CN',
  loading: false,
  scrollToToday: false,
  ariaLabel: '甘特图',
  expandLabel: '展开',
  collapseLabel: '收起',
  taskHeaderText: '任务',
  todayText: '今天',
  emptyText: '暂无任务',
  progressText: '进度',
})

const emit = defineEmits<{
  'update:selected': [id: GanttTaskId | null]
  'task-click': [task: GanttTask, event: MouseEvent]
  'task-dblclick': [task: GanttTask, event: MouseEvent]
  'task-contextmenu': [task: GanttTask, event: MouseEvent]
  'context-menu-select': [event: GanttContextMenuSelectEvent]
  'task-update': [event: GanttTaskUpdateEvent]
  'task-drag-start': [task: GanttTask, mode: GanttDragMode]
  'task-drag': [event: GanttTaskDragEvent]
  'task-drag-end': [event: GanttDragEndEvent]
  expand: [task: GanttTask, expanded: boolean]
  scroll: [event: GanttScrollEvent]
}>()

defineSlots<{
  toolbar?: (props: GanttToolbarSlotProps) => unknown
  corner?: (props: { taskCount: number }) => unknown
  sidebar?: (props: GanttSidebarSlotProps) => unknown
  task?: (props: GanttTaskSlotProps) => unknown
  tooltip?: (props: GanttTooltipSlotProps) => unknown
  'context-menu'?: (props: GanttContextMenuSlotProps) => unknown
  empty?: (props: GanttEmptySlotProps) => unknown
}>()

interface HeaderSegment {
  key: string
  label: string
  sublabel?: string
  width: number
  count: number
  startDate: Date
  weekend: boolean
  current: boolean
}

interface BarLayout {
  left: number
  top: number
  width: number
  height: number
  isMilestone: boolean
  isGroup: boolean
}

interface RowView {
  row: GanttRow
  layout: BarLayout
  style: CSSProperties
  title: string
}

interface DragState {
  row: GanttRow
  mode: GanttDragMode
  pointerId: number
  pointerX: number
  startClientX: number
  startScrollLeft: number
  originStart: Date
  originEnd: Date
  previewStart: Date
  previewEnd: Date
  /** Becomes true once the pointer has moved past the drag threshold. */
  active: boolean
}

interface TooltipState {
  row: GanttRow
  left: number
  top: number
  placement: 'top' | 'bottom'
}

interface ContextMenuState {
  row: GanttRow
  x: number
  y: number
  items: GanttContextMenuItem[]
}

interface DependencyLine {
  key: string
  path: string
}

const HEADER_HEIGHT = 56
const DRAG_THRESHOLD = 4
const DEFAULT_DAY_WIDTH: Record<GanttView, number> = {
  day: 36,
  week: 14,
  month: 5,
}

const slots = useSlots()
const scrollRef = ref<HTMLElement>()
const contextMenuRef = ref<HTMLElement>()
const contextMenuState = shallowRef<ContextMenuState | null>(null)
const contextMenuTrigger = shallowRef<HTMLElement | null>(null)
const activeBarKey = ref<string | null>(null)
const today = ref(startOfDay(new Date()))
const collapsedKeys = ref(new Set<string>())
const { value: selected, setValue: setSelected } = useControllableState<GanttTaskId | null>({
  value: () => props.selected,
  defaultValue: null,
  onChange: (value) => emit('update:selected', value),
})
const dragState = shallowRef<DragState | null>(null)
const tooltipState = shallowRef<TooltipState | null>(null)
const initializedGroups = new Set<string>()
const lastExplicitCollapsed = new Map<string, boolean | undefined>()

const scrollRaf = useRaf(() => {
  if (!pendingScrollEvent) return
  emit('scroll', pendingScrollEvent)
  pendingScrollEvent = null
})

const autoScrollRaf = useRaf(tickAutoScroll)

let lastDragEndAt = 0
let previousUserSelect = ''
let dragCaptureTarget: HTMLElement | null = null
let dragScrollRect: DOMRect | null = null
let pendingScrollEvent: GanttScrollEvent | null = null

const markerId = `w-gantt-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

const weekStartsOn = computed(() => ((Math.trunc(props.weekStartsOn) % 7) + 7) % 7)
const dayWidth = computed(() =>
  props.dayWidth && props.dayWidth > 0 ? props.dayWidth : DEFAULT_DAY_WIDTH[props.view],
)

const resolution = computed(() => resolveTasks(props.tasks, today.value))
const byKey = computed(() => resolution.value.byKey)
const selectedKey = computed(() => (selected.value === null ? null : taskKey(selected.value)))

function syncCollapsedState() {
  const next = new Set(collapsedKeys.value)
  let changed = false
  const validGroups = new Set<string>()

  for (const resolved of resolution.value.all) {
    if (!resolved.hasChildren) continue
    validGroups.add(resolved.key)

    const explicit =
      typeof resolved.task.collapsed === 'boolean' ? resolved.task.collapsed : undefined

    if (!initializedGroups.has(resolved.key)) {
      initializedGroups.add(resolved.key)
      lastExplicitCollapsed.set(resolved.key, explicit)
      if (explicit === true || (explicit === undefined && !props.defaultExpandAll)) {
        next.add(resolved.key)
        changed = true
      }
      continue
    }

    const previousExplicit = lastExplicitCollapsed.get(resolved.key)
    if (explicit !== previousExplicit && explicit !== undefined) {
      if (explicit) {
        if (!next.has(resolved.key)) {
          next.add(resolved.key)
          changed = true
        }
      } else if (next.has(resolved.key)) {
        next.delete(resolved.key)
        changed = true
      }
    }
    lastExplicitCollapsed.set(resolved.key, explicit)
  }

  for (const key of next) {
    if (!validGroups.has(key)) {
      next.delete(key)
      changed = true
    }
  }

  for (const key of initializedGroups) {
    if (!validGroups.has(key)) {
      initializedGroups.delete(key)
      lastExplicitCollapsed.delete(key)
    }
  }

  if (changed) collapsedKeys.value = next
}

watch(() => props.tasks, syncCollapsedState, { immediate: true, deep: true })

const rows = computed<GanttRow[]>(() => {
  const result: GanttRow[] = []

  function walk(nodes: ResolvedTask[], depth: number) {
    for (const node of nodes) {
      const expanded = !collapsedKeys.value.has(node.key)
      result.push({
        task: node.task,
        key: node.key,
        depth,
        index: result.length,
        start: node.start,
        end: node.end,
        progress: node.progress,
        color: node.color,
        hasChildren: node.hasChildren,
        expanded,
        parentKey: node.parentKey,
      })

      if (expanded) walk(node.children, depth + 1)
    }
  }

  walk(resolution.value.roots, 0)
  return result
})

const bodyHeight = computed(() => rows.value.length * props.rowHeight)

// Roving tabindex: exactly one task bar is reachable with Tab at any time.
const tabStopKey = computed(() => {
  const key = activeBarKey.value
  if (key && rows.value.some((row) => row.key === key)) return key
  return rows.value[0]?.key ?? null
})

const range = computed(() => {
  const tasks = resolution.value.all
  const min = minDate(tasks.map((task) => task.start))
  const max = maxDate(tasks.map((task) => task.end))
  const padding =
    props.view === 'month'
      ? Math.max(props.rangePadding, 20)
      : props.view === 'week'
        ? Math.max(props.rangePadding, 7)
        : props.rangePadding

  let start =
    parseDate(props.startDate) ?? (min ? addDays(min, -padding) : addDays(today.value, -3))
  let end = parseDate(props.endDate) ?? (max ? addDays(max, padding) : addDays(today.value, 27))

  if (props.startDate === undefined || props.startDate === null) {
    if (props.view === 'week') start = startOfWeek(start, weekStartsOn.value)
    else if (props.view === 'month') start = startOfMonth(start)
  }

  if (props.endDate === undefined || props.endDate === null) {
    if (props.view === 'week') end = addDays(startOfWeek(end, weekStartsOn.value), 6)
    else if (props.view === 'month') end = endOfMonth(end)
  }

  start = startOfDay(start)
  end = startOfDay(end)
  if (dayDiff(end, start) < 0) end = start

  const rangeDays = dayDiff(end, start) + 1
  if (props.maxRangeDays > 0 && rangeDays > props.maxRangeDays) {
    // Degrade to the safe limit instead of throwing from a render computed.
    end = addDays(start, props.maxRangeDays - 1)
  }

  return { start, end }
})

const totalDays = computed(() => Math.max(1, dayDiff(range.value.end, range.value.start) + 1))
const days = computed(() => eachDay(range.value.start, range.value.end))
const timelineWidth = computed(() => totalDays.value * dayWidth.value)

const todayOffset = computed(() => dayDiff(today.value, range.value.start))
const todayVisible = computed(
  () => props.showToday && todayOffset.value >= 0 && todayOffset.value < totalDays.value,
)
const todayX = computed(() => todayOffset.value * dayWidth.value + dayWidth.value / 2)

const formatters = computed(() => {
  const locale = props.locale
  const create = (options: Intl.DateTimeFormatOptions) => {
    try {
      return new Intl.DateTimeFormat(locale, options)
    } catch {
      return new Intl.DateTimeFormat(undefined, options)
    }
  }

  return {
    day: create({ day: 'numeric' }),
    weekday: create({ weekday: 'narrow' }),
    week: create({ month: 'numeric', day: 'numeric' }),
    monthShort: create({ month: 'short' }),
    monthPrimary: create({ year: '2-digit', month: 'short' }),
    year: create({ year: 'numeric' }),
    fullDate: create({ year: 'numeric', month: 'short', day: 'numeric' }),
  }
})

const primarySegments = computed<HeaderSegment[]>(() => {
  const segments = new Map<string, HeaderSegment>()
  const formatter = formatters.value
  const isYear = props.view === 'month'

  for (const day of days.value) {
    const key = isYear ? `y-${day.getFullYear()}` : `m-${day.getFullYear()}-${day.getMonth()}`

    let segment = segments.get(key)
    if (!segment) {
      segment = {
        key,
        label: isYear ? formatter.year.format(day) : formatter.monthPrimary.format(day),
        width: 0,
        count: 0,
        startDate: day,
        weekend: false,
        current: false,
      }
      segments.set(key, segment)
    }

    segment.width += dayWidth.value
    segment.count += 1
  }

  return [...segments.values()]
})

const secondarySegments = computed<HeaderSegment[]>(() => {
  const formatter = formatters.value

  if (props.view === 'day') {
    return days.value.map((day) => ({
      key: `d-${day.getTime()}`,
      label: formatter.day.format(day),
      sublabel: formatter.weekday.format(day),
      width: dayWidth.value,
      count: 1,
      startDate: day,
      weekend: isWeekend(day),
      current: props.showToday && isSameDay(day, today.value),
    }))
  }

  const segments = new Map<string, HeaderSegment>()

  for (const day of days.value) {
    const key =
      props.view === 'week'
        ? `w-${startOfWeek(day, weekStartsOn.value).getTime()}`
        : `m-${day.getFullYear()}-${day.getMonth()}`

    let segment = segments.get(key)
    if (!segment) {
      segment = {
        key,
        label:
          props.view === 'week' ? formatter.week.format(day) : formatter.monthShort.format(day),
        width: 0,
        count: 0,
        startDate: day,
        weekend: false,
        current: false,
      }
      segments.set(key, segment)
    }

    segment.width += dayWidth.value
    segment.count += 1
    if (props.showToday && isSameDay(day, today.value)) segment.current = true
  }

  return [...segments.values()]
})

function toUnit(value: string | number | undefined): string | undefined {
  return typeof value === 'number' ? `${value}px` : value
}

const rootStyle = computed(
  () =>
    ({
      height: toUnit(props.height),
      '--w-gantt-header-height': `${HEADER_HEIGHT}px`,
    }) as CSSProperties,
)

const canvasStyle = computed(() => ({
  width: `${props.sidebarWidth + timelineWidth.value}px`,
}))

function effectiveDates(row: GanttRow): { start: Date; end: Date } {
  const drag = dragState.value
  if (drag && drag.row.key === row.key) {
    return { start: drag.previewStart, end: drag.previewEnd }
  }
  return { start: row.start, end: row.end }
}

function computeBarLayout(row: GanttRow, start: Date, end: Date): BarLayout {
  const startX = dayDiff(start, range.value.start) * dayWidth.value
  const milestone = Boolean(row.task.milestone) && !row.hasChildren

  if (milestone) {
    const size = props.taskHeight
    return {
      left: startX + dayWidth.value / 2 - size / 2,
      top: (props.rowHeight - size) / 2,
      width: size,
      height: size,
      isMilestone: true,
      isGroup: false,
    }
  }

  const groupHeight = Math.min(10, Math.max(6, Math.round(props.taskHeight * 0.42)))
  const height = row.hasChildren ? groupHeight : props.taskHeight
  const endX = (dayDiff(end, range.value.start) + 1) * dayWidth.value
  const width = Math.max(4, endX - startX - 4)

  return {
    left: startX + 2,
    top: Math.round((props.rowHeight - height) / 2),
    width,
    height,
    isMilestone: false,
    isGroup: row.hasChildren,
  }
}

function barLayout(row: GanttRow): BarLayout {
  const { start, end } = effectiveDates(row)
  return computeBarLayout(row, start, end)
}

const colorStyleCache = new Map<string, CSSProperties>()

function taskColorStyle(color: string): CSSProperties {
  const cached = colorStyleCache.get(color)
  if (cached) return cached

  const style = {
    '--w-gantt-task-color': color,
    '--w-gantt-task-soft':
      colorWithAlpha(color, 0.14) ?? 'var(--w-color-primary-soft, rgba(79, 70, 229, 0.1))',
    '--w-gantt-task-border': colorWithAlpha(color, 0.38) ?? 'var(--w-color-border-strong, #cbd5e1)',
  } as CSSProperties

  if (colorStyleCache.size >= 256) colorStyleCache.clear()
  colorStyleCache.set(color, style)
  return style
}

function taskTitle(row: GanttRow): string {
  const start = formatters.value.fullDate.format(row.start)
  const end = formatters.value.fullDate.format(row.end)
  return `${row.task.name}\n${start}${start === end ? '' : ` - ${end}`}\n${props.progressText}: ${row.progress}%`
}

const rowViews = computed<RowView[]>(() =>
  rows.value.map((row) => {
    const layout = computeBarLayout(row, row.start, row.end)
    const style = {
      left: `${layout.left}px`,
      top: `${layout.top}px`,
      width: `${layout.width}px`,
      height: `${layout.height}px`,
      ...taskColorStyle(row.color),
    } as CSSProperties

    return {
      row,
      layout,
      style,
      title: taskTitle(row),
    }
  }),
)

function barAriaLabel(view: RowView): string {
  const progressShown = props.showProgress && view.row.progress > 0 && view.layout.width > 110
  const start = formatters.value.fullDate.format(view.row.start)
  const end = formatters.value.fullDate.format(view.row.end)
  const dates = start === end ? start : `${start} - ${end}`
  // Keep the visible name + percentage contiguous so the accessible name
  // contains the rendered text (axe: label-content-name-mismatch).
  const progress = progressShown ? ` ${view.row.progress}%` : ''
  const name = view.row.task.ariaLabel ?? view.row.task.name
  return `${name}${progress}, ${dates}`.trim()
}

function barStyle(view: RowView): CSSProperties {
  const drag = dragState.value
  if (!drag || drag.row.key !== view.row.key) return view.style

  const layout = computeBarLayout(view.row, drag.previewStart, drag.previewEnd)
  return {
    left: `${layout.left}px`,
    top: `${layout.top}px`,
    width: `${layout.width}px`,
    height: `${layout.height}px`,
    ...taskColorStyle(view.row.color),
  } as CSSProperties
}

function effectiveStart(row: GanttRow): Date {
  return effectiveDates(row).start
}

function effectiveEnd(row: GanttRow): Date {
  return effectiveDates(row).end
}

const dependencyLines = computed<DependencyLine[]>(() => {
  if (!props.showDependencies) return []

  const visible = new Map(rows.value.map((row) => [row.key, row]))
  const lines: DependencyLine[] = []

  for (const row of rows.value) {
    for (const dependencyId of new Set(row.task.dependencies ?? [])) {
      const predecessor = visible.get(taskKey(dependencyId))
      if (!predecessor || predecessor.key === row.key) continue

      const predDates = effectiveDates(predecessor)
      const dates = effectiveDates(row)
      const predMilestone = Boolean(predecessor.task.milestone) && !predecessor.hasChildren
      const milestone = Boolean(row.task.milestone) && !row.hasChildren

      const predStartX = dayDiff(predDates.start, range.value.start) * dayWidth.value
      const predEndX = (dayDiff(predDates.end, range.value.start) + 1) * dayWidth.value
      const targetStartX = dayDiff(dates.start, range.value.start) * dayWidth.value

      const fromX = predMilestone
        ? predStartX + dayWidth.value / 2 + props.taskHeight / 2
        : predEndX + 2
      const toX = milestone
        ? targetStartX + dayWidth.value / 2 - props.taskHeight / 2 - 2
        : targetStartX - 2
      const fromY = predecessor.index * props.rowHeight + props.rowHeight / 2
      const toY = row.index * props.rowHeight + props.rowHeight / 2

      let path: string
      if (toX >= fromX + 20) {
        const midX = (fromX + toX) / 2
        path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`
      } else {
        const detourX = Math.max(fromX, toX) + 22
        path = `M ${fromX} ${fromY} H ${detourX} V ${toY} H ${toX}`
      }

      lines.push({
        key: `${predecessor.key}->${row.key}`,
        path,
      })
    }
  }

  return lines
})

function dayClasses(day: Date) {
  return {
    'is-weekend': props.showWeekends && isWeekend(day),
    'is-today': props.showToday && isSameDay(day, today.value),
    'is-boundary':
      props.view === 'day' ||
      (props.view === 'week' && day.getDay() === weekStartsOn.value) ||
      (props.view === 'month' && day.getDate() === 1),
  }
}

function secondaryClass(segment: HeaderSegment) {
  return {
    'is-weekend': props.showWeekends && segment.weekend,
    'is-current': segment.current,
  }
}

function selectRow(row: GanttRow) {
  if (!props.selectable) return

  setSelected(row.task.id)
}

function onSidebarClick(row: GanttRow, event: MouseEvent) {
  selectRow(row)
  emit('task-click', row.task, event)
}

function onTaskClick(row: GanttRow, event: MouseEvent) {
  if (Date.now() - lastDragEndAt < 150) return
  selectRow(row)
  emit('task-click', row.task, event)
}

function onTaskDblClick(row: GanttRow, event: MouseEvent) {
  emit('task-dblclick', row.task, event)
}

function keyboardNudge(row: GanttRow, mode: GanttDragMode, deltaDays: number) {
  if (deltaDays === 0) return

  let nextStart = row.start
  let nextEnd = row.end
  let delta = deltaDays

  if (mode === 'move') {
    const min = Math.min(0, dayDiff(range.value.start, row.start))
    const max = Math.max(0, dayDiff(range.value.end, row.end))
    delta = Math.min(max, Math.max(min, delta))
    nextStart = addDays(row.start, delta)
    nextEnd = addDays(row.end, delta)
  } else if (mode === 'resize-start') {
    const min = Math.min(0, dayDiff(range.value.start, row.start))
    const max = Math.max(0, dayDiff(row.end, row.start))
    delta = Math.min(max, Math.max(min, delta))
    nextStart = addDays(row.start, delta)
  } else {
    const min = Math.min(0, dayDiff(row.start, row.end))
    const max = Math.max(0, dayDiff(range.value.end, row.end))
    delta = Math.min(max, Math.max(min, delta))
    nextEnd = addDays(row.end, delta)
  }

  if (isSameDay(nextStart, row.start) && isSameDay(nextEnd, row.end)) return

  emit('task-update', {
    task: row.task,
    mode,
    start: nextStart,
    end: nextEnd,
    previousStart: row.start,
    previousEnd: row.end,
  })
}

function setActiveBar(row: GanttRow): void {
  activeBarKey.value = row.key
}

/** Move focus between visible task bars without creating extra tab stops. */
function focusBar(row: GanttRow): void {
  activeBarKey.value = row.key
  void nextTick(() => {
    const bars = scrollRef.value?.querySelectorAll<HTMLElement>('.w-gantt__bar')
    if (!bars) return
    for (const bar of bars) {
      if (bar.dataset.rowKey === row.key) {
        bar.focus()
        return
      }
    }
  })
}

function onBarKeydown(event: KeyboardEvent, row: GanttRow) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectRow(row)
    return
  }

  if (
    (event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' ||
      event.key === 'Home' ||
      event.key === 'End') &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    const visible = rows.value
    const current = visible.findIndex((item) => item.key === row.key)
    if (current < 0) return

    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? visible.length - 1
          : event.key === 'ArrowUp'
            ? current - 1
            : current + 1
    if (nextIndex === current || nextIndex < 0 || nextIndex >= visible.length) return

    event.preventDefault()
    const next = visible[nextIndex]
    if (next) focusBar(next)
    return
  }

  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  if (event.ctrlKey || event.metaKey) return

  const direction = event.key === 'ArrowRight' ? 1 : -1
  let mode: GanttDragMode = 'move'

  if (event.shiftKey || event.altKey) {
    // Milestones (canResize=false) have no resize semantics: swallow the
    // modifier combinations rather than silently degrading them to move.
    if (!canResize(row)) {
      event.preventDefault()
      return
    }
    mode = event.shiftKey ? 'resize-end' : 'resize-start'
  } else if (!canMove(row)) {
    return
  }

  event.preventDefault()
  selectRow(row)
  keyboardNudge(row, mode, direction)
}

function toggleTask(row: GanttRow) {
  if (!row.hasChildren) return

  const next = new Set(collapsedKeys.value)
  const expanded = next.has(row.key)
  if (expanded) next.delete(row.key)
  else next.add(row.key)

  collapsedKeys.value = next
  emit('expand', row.task, expanded)
}

function showTooltip(row: GanttRow) {
  if (dragState.value) return

  const layout = barLayout(row)
  const rawLeft = props.sidebarWidth + layout.left + layout.width / 2
  const left = Math.min(
    Math.max(rawLeft, props.sidebarWidth + 120),
    props.sidebarWidth + timelineWidth.value - 120,
  )
  const top = row.index * props.rowHeight + layout.top
  const placement: 'top' | 'bottom' = row.index > 0 ? 'top' : 'bottom'

  tooltipState.value = {
    row,
    left,
    top: placement === 'top' ? top - 8 : top + layout.height + 8,
    placement,
  }
}

function hideTooltip() {
  tooltipState.value = null
}

function resolveContextMenuItems(task: GanttTask): GanttContextMenuItem[] {
  const source = props.contextMenuItems
  if (!source) return []
  return typeof source === 'function' ? source(task) : source
}

const contextMenuItems = computed(() => contextMenuState.value?.items ?? [])

function onTaskContextMenu(row: GanttRow, event: MouseEvent): void {
  emit('task-contextmenu', row.task, event)

  // Resolve the factory once per right-click and reuse it for rendering.
  const items = resolveContextMenuItems(row.task)
  if (!slots['context-menu'] && !items.some((item) => !item.divider)) return

  event.preventDefault()
  event.stopPropagation()
  hideTooltip()
  selectRow(row)

  contextMenuTrigger.value = event.currentTarget as HTMLElement | null
  contextMenuState.value = { row, x: event.clientX, y: event.clientY, items }
  contextMenuDismiss.start()

  nextTick(() => {
    clampContextMenu()
    contextMenuNavigation.first()
  })
}

function closeContextMenu(restoreFocus = false): void {
  const trigger = contextMenuTrigger.value
  contextMenuState.value = null
  contextMenuTrigger.value = null
  contextMenuDismiss.stop()

  if (restoreFocus) nextTick(() => trigger?.focus({ preventScroll: true }))
}

function selectContextMenuItem(item: GanttContextMenuItem): void {
  const state = contextMenuState.value
  if (!state || item.disabled || item.divider) return

  emit('context-menu-select', { item, task: state.row.task, row: state.row })
  closeContextMenu(true)
}

function clampContextMenu(): void {
  const state = contextMenuState.value
  const menu = contextMenuRef.value
  if (!state || !menu) return

  const next = clampToViewport(state.x, state.y, menu.getBoundingClientRect(), { margin: 8 })
  if (next.x !== state.x || next.y !== state.y) {
    contextMenuState.value = { ...state, x: next.x, y: next.y }
  }
}

function contextMenuButtons(): HTMLButtonElement[] {
  return Array.from(
    contextMenuRef.value?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ??
      [],
  )
}

const enabledContextMenuItems = computed(() =>
  contextMenuItems.value.filter((item) => !item.divider && !item.disabled),
)

const contextMenuNavigation = useListNavigation({
  items: enabledContextMenuItems,
  activeIndex: () => {
    const buttons = contextMenuButtons()
    return buttons.indexOf(document.activeElement as HTMLButtonElement)
  },
  onHighlight: (index) => {
    contextMenuButtons()[index]?.focus({ preventScroll: true })
  },
})

const contextMenuDismiss = useDismissable({
  ignore: contextMenuRef,
  resize: true,
  scroll: true,
  onDismiss: (reason) => closeContextMenu(reason === 'escape'),
})

function onContextMenuKeydown(event: KeyboardEvent): void {
  if (event.key === 'Tab') {
    closeContextMenu()
    return
  }
  contextMenuNavigation.handleKeydown(event)
}

function canResize(row: GanttRow): boolean {
  return (
    !props.readonly &&
    props.resizable &&
    !row.hasChildren &&
    !row.task.milestone &&
    !row.task.disabled
  )
}

function canMove(row: GanttRow): boolean {
  return !props.readonly && props.draggable && !row.hasChildren && !row.task.disabled
}

function keyboardShortcuts(row: GanttRow): string | undefined {
  const navigation = 'ArrowUp ArrowDown Home End'
  if (canResize(row)) {
    return `${navigation} ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight Alt+ArrowLeft Alt+ArrowRight`
  }
  if (canMove(row)) return `${navigation} ArrowLeft ArrowRight`
  return navigation
}

function tickAutoScroll() {
  const state = dragState.value
  const scroll = scrollRef.value
  if (!state || !scroll) return

  // Cache the viewport rect; it does not change while auto-scrolling.
  const rect = dragScrollRect ?? (dragScrollRect = scroll.getBoundingClientRect())
  const leftEdge = rect.left + props.sidebarWidth + 36
  const rightEdge = rect.right - 36
  let delta = 0

  if (state.pointerX > rightEdge) {
    delta = Math.min(20, 6 + (state.pointerX - rightEdge) / 2)
  } else if (state.pointerX < leftEdge) {
    delta = -Math.min(20, 6 + (leftEdge - state.pointerX) / 2)
  }

  if (delta !== 0) {
    scroll.scrollLeft += delta
    updatePreviewAt(state.pointerX)
  }

  autoScrollRaf.schedule()
}

function beginAutoScroll() {
  if (typeof requestAnimationFrame === 'undefined') return
  autoScrollRaf.cancel()
  autoScrollRaf.schedule()
}

function updatePreviewAt(clientX: number) {
  const state = dragState.value
  if (!state) return

  const scrollLeft = scrollRef.value?.scrollLeft ?? 0
  const scrollDelta = scrollLeft - state.startScrollLeft
  let deltaDays = Math.round((clientX - state.startClientX + scrollDelta) / dayWidth.value)

  let nextStart = state.originStart
  let nextEnd = state.originEnd

  if (state.mode === 'move') {
    const min = Math.min(0, dayDiff(range.value.start, state.originStart))
    const max = Math.max(0, dayDiff(range.value.end, state.originEnd))
    deltaDays = Math.min(max, Math.max(min, deltaDays))
    nextStart = addDays(state.originStart, deltaDays)
    nextEnd = addDays(state.originEnd, deltaDays)
  } else if (state.mode === 'resize-start') {
    const min = Math.min(0, dayDiff(range.value.start, state.originStart))
    const max = Math.max(0, dayDiff(state.originEnd, state.originStart))
    deltaDays = Math.min(max, Math.max(min, deltaDays))
    nextStart = addDays(state.originStart, deltaDays)
  } else {
    const min = Math.min(0, dayDiff(state.originStart, state.originEnd))
    const max = Math.max(0, dayDiff(range.value.end, state.originEnd))
    deltaDays = Math.min(max, Math.max(min, deltaDays))
    nextEnd = addDays(state.originEnd, deltaDays)
  }

  const datesChanged =
    !isSameDay(nextStart, state.previewStart) || !isSameDay(nextEnd, state.previewEnd)

  // `pointerX` is only consumed by the auto-scroll loop, so mutate it in place.
  state.pointerX = clientX
  if (!datesChanged) return

  dragState.value = {
    ...state,
    previewStart: nextStart,
    previewEnd: nextEnd,
  }

  emit('task-drag', {
    task: state.row.task,
    mode: state.mode,
    start: nextStart,
    end: nextEnd,
  })
}

function beginTaskDrag(event: PointerEvent, row: GanttRow) {
  if (event.button !== 0) return

  const target = event.target as HTMLElement | null
  const handle = target?.closest<HTMLElement>('[data-w-gantt-handle]')
  const handleEdge = handle?.dataset.wGanttHandle
  const mode: GanttDragMode =
    handleEdge === 'start' ? 'resize-start' : handleEdge === 'end' ? 'resize-end' : 'move'

  if (mode === 'move' && !canMove(row)) return
  if (mode !== 'move' && !canResize(row)) return
  if (event.pointerId === undefined) return

  event.preventDefault()
  event.stopPropagation()
  hideTooltip()

  dragState.value = {
    row,
    mode,
    pointerId: event.pointerId,
    pointerX: event.clientX,
    startClientX: event.clientX,
    startScrollLeft: scrollRef.value?.scrollLeft ?? 0,
    originStart: row.start,
    originEnd: row.end,
    previewStart: row.start,
    previewEnd: row.end,
    active: false,
  }

  dragCaptureTarget = event.currentTarget as HTMLElement | null
  try {
    dragCaptureTarget?.setPointerCapture(event.pointerId)
  } catch {
    // Pointer capture is best-effort (unsupported or already released).
  }

  drag.start(event)
  window.addEventListener('keydown', handleDragKeydown)
  window.addEventListener('blur', cancelDrag)
}

function activateDrag(state: DragState): void {
  if (state.active) return

  dragScrollRect = scrollRef.value?.getBoundingClientRect() ?? null
  dragState.value = { ...state, active: true }

  if (typeof document !== 'undefined') {
    previousUserSelect = document.body.style.userSelect
    document.body.style.userSelect = 'none'
  }

  emit('task-drag-start', state.row.task, state.mode)
  beginAutoScroll()
}

function handleDragMove(event: PointerEvent) {
  const state = dragState.value
  if (!state || event.pointerId !== state.pointerId) return

  // Do not start dragging (or edge auto-scrolling) until the pointer makes an
  // intentional movement. A plain press on a bar inside the auto-scroll band
  // must never shift dates.
  if (!state.active) {
    if (Math.abs(event.clientX - state.startClientX) < DRAG_THRESHOLD) return
    activateDrag(state)
  }

  updatePreviewAt(event.clientX)
}

function handleDragKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && dragState.value) {
    event.preventDefault()
    cancelDrag()
  }
}

function finishDrag(canceled: boolean) {
  const state = dragState.value
  if (!state) return

  drag.stop()
  window.removeEventListener('keydown', handleDragKeydown)
  window.removeEventListener('blur', cancelDrag)
  if (dragCaptureTarget) {
    try {
      dragCaptureTarget.releasePointerCapture(state.pointerId)
    } catch {
      // The capture may already be released.
    }
    dragCaptureTarget = null
  }
  autoScrollRaf.cancel()

  if (state.active && typeof document !== 'undefined') {
    document.body.style.userSelect = previousUserSelect
  }

  const changed =
    !isSameDay(state.previewStart, state.originStart) ||
    !isSameDay(state.previewEnd, state.originEnd)
  const effectiveChanged = state.active && !canceled && changed
  const event: GanttDragEndEvent = {
    task: state.row.task,
    mode: state.mode,
    start: state.previewStart,
    end: state.previewEnd,
    canceled,
    changed: effectiveChanged,
  }

  if (effectiveChanged) {
    selectRow(state.row)
    emit('task-update', {
      task: state.row.task,
      mode: state.mode,
      start: state.previewStart,
      end: state.previewEnd,
      previousStart: state.originStart,
      previousEnd: state.originEnd,
    })
    lastDragEndAt = Date.now()
  }

  dragState.value = null
  dragScrollRect = null
  emit('task-drag-end', event)
}

function handleDragEnd(event: PointerEvent) {
  const state = dragState.value
  if (!state || event.pointerId !== state.pointerId) return
  // Before the threshold there is no drag to commit; finish without emitting
  // task-update (finishDrag reports `changed: false`).
  if (state.active) updatePreviewAt(event.clientX)
  finishDrag(false)
}

function handleDragCancel(event: PointerEvent) {
  const state = dragState.value
  if (!state || event.pointerId !== state.pointerId) return
  finishDrag(true)
}

function cancelDrag() {
  if (dragState.value) finishDrag(true)
}

const drag = usePointerDrag({
  onMove: handleDragMove,
  onEnd: handleDragEnd,
  onCancel: handleDragCancel,
})

function handleScroll() {
  const scroll = scrollRef.value
  if (!scroll) return

  hideTooltip()
  if (contextMenuState.value) closeContextMenu()
  pendingScrollEvent = {
    scrollTop: scroll.scrollTop,
    scrollLeft: scroll.scrollLeft,
  }

  if (typeof requestAnimationFrame === 'undefined') {
    emit('scroll', pendingScrollEvent)
    pendingScrollEvent = null
    return
  }

  if (scrollRaf.isPending()) return
  scrollRaf.schedule()
}

function scrollToDate(
  value: DateLike,
  options: { align?: 'start' | 'center' | 'end'; behavior?: ScrollBehavior } = {},
) {
  const scroll = scrollRef.value
  const date = parseDate(value)
  if (!scroll || !date) return

  const x = dayDiff(date, range.value.start) * dayWidth.value + dayWidth.value / 2
  const available = Math.max(1, scroll.clientWidth - props.sidebarWidth)
  const align = options.align ?? 'center'

  let left = x - available / 2
  if (align === 'start') left = x - 24
  if (align === 'end') left = x - available + 24

  scroll.scrollTo({
    left: Math.max(0, left),
    behavior: options.behavior ?? 'smooth',
  })
}

function scrollToToday() {
  scrollToDate(today.value)
}

async function scrollToTask(id: GanttTaskId) {
  const scroll = scrollRef.value
  const key = taskKey(id)
  const resolved = byKey.value.get(key)
  if (!scroll || !resolved) return

  const next = new Set(collapsedKeys.value)
  let parentKey = resolved.parentKey
  let expanded = false

  while (parentKey) {
    if (next.delete(parentKey)) expanded = true
    parentKey = byKey.value.get(parentKey)?.parentKey ?? null
  }

  if (expanded) {
    collapsedKeys.value = next
    await nextTick()
  }

  const row = rows.value.find((item) => item.key === key)
  if (!row) return

  const x = dayDiff(row.start, range.value.start) * dayWidth.value + dayWidth.value / 2
  const available = Math.max(1, scroll.clientWidth - props.sidebarWidth)
  const top = Math.max(
    0,
    HEADER_HEIGHT + row.index * props.rowHeight + props.rowHeight / 2 - scroll.clientHeight / 2,
  )

  scroll.scrollTo({
    left: Math.max(0, x - available / 2),
    top,
    behavior: 'smooth',
  })
}

function getTaskById(id: GanttTaskId): GanttTask | undefined {
  return byKey.value.get(taskKey(id))?.task
}

function refreshToday() {
  const next = startOfDay(new Date())
  if (!isSameDay(next, today.value)) today.value = next
}

watch(
  () => props.defaultExpandAll,
  () => {
    if (props.defaultExpandAll) {
      const next = new Set(collapsedKeys.value)
      for (const resolved of resolution.value.all) {
        if (resolved.hasChildren) next.delete(resolved.key)
      }
      collapsedKeys.value = next
    }
  },
)

const todayInterval = useIntervalFn(refreshToday, 60_000)

function startTodayTimer(): void {
  if (props.showToday) todayInterval.start()
}

function stopTodayTimer(): void {
  todayInterval.stop()
}

watch(
  () => props.showToday,
  (value) => {
    if (value) startTodayTimer()
    else stopTodayTimer()
  },
)

onMounted(() => {
  if (props.scrollToToday) nextTick(scrollToToday)
  startTodayTimer()
})

onBeforeUnmount(() => {
  autoScrollRaf.cancel()
  scrollRaf.cancel()
  stopTodayTimer()
  drag.stop()
  window.removeEventListener('keydown', handleDragKeydown)
  window.removeEventListener('blur', cancelDrag)
  if (dragCaptureTarget) {
    try {
      dragCaptureTarget.releasePointerCapture(dragState.value?.pointerId ?? 0)
    } catch {
      // Capture may already be released.
    }
    dragCaptureTarget = null
  }
  contextMenuDismiss.stop()
  if (dragState.value && typeof document !== 'undefined') {
    document.body.style.userSelect = previousUserSelect
  }
  dragState.value = null
})

defineExpose({
  rows,
  scrollRef,
  scrollToDate,
  scrollToToday,
  scrollToTask,
  getTaskById,
})
</script>

<template>
  <div
    class="w-gantt"
    :class="{ 'is-loading': loading, 'is-dragging': Boolean(dragState) }"
    :style="rootStyle"
    :aria-busy="loading"
  >
    <div v-if="$slots.toolbar" class="w-gantt__toolbar">
      <slot
        name="toolbar"
        :view="view"
        :start-date="range.start"
        :end-date="range.end"
        :scroll-to-today="scrollToToday"
        :scroll-to-task="scrollToTask"
      />
    </div>

    <div ref="scrollRef" class="w-gantt__scroll" @scroll.passive="handleScroll">
      <div
        class="w-gantt__canvas"
        :style="canvasStyle"
        role="treegrid"
        :aria-label="ariaLabel"
        :aria-rowcount="rows.length + 1"
        :aria-colcount="2"
      >
        <div class="w-gantt__header" role="row" :aria-rowindex="1">
          <div
            class="w-gantt__corner"
            :style="{ width: `${sidebarWidth}px` }"
            role="columnheader"
            :aria-colindex="1"
          >
            <slot name="corner" :task-count="rows.length">
              <span class="w-gantt__header-title">{{ taskHeaderText }}</span>
              <span class="w-gantt__header-count">{{ rows.length }}</span>
            </slot>
          </div>

          <div
            class="w-gantt__header-timeline"
            :style="{ width: `${timelineWidth}px` }"
            role="columnheader"
            :aria-colindex="2"
          >
            <div class="w-gantt__header-row w-gantt__header-row--primary">
              <div
                v-for="segment in primarySegments"
                :key="segment.key"
                class="w-gantt__header-cell"
                :style="{ width: `${segment.width}px` }"
                :title="segment.label"
              >
                {{ segment.label }}
              </div>
            </div>
            <div class="w-gantt__header-row w-gantt__header-row--secondary">
              <div
                v-for="segment in secondarySegments"
                :key="segment.key"
                class="w-gantt__header-cell w-gantt__header-cell--secondary"
                :class="secondaryClass(segment)"
                :style="{ width: `${segment.width}px` }"
              >
                <span class="w-gantt__header-day">{{ segment.label }}</span>
                <span v-if="segment.sublabel" class="w-gantt__header-weekday">
                  {{ segment.sublabel }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="w-gantt__body" :style="{ height: `${bodyHeight}px` }" role="rowgroup">
          <div
            class="w-gantt__grid"
            :style="{ left: `${sidebarWidth}px`, width: `${timelineWidth}px` }"
            aria-hidden="true"
          >
            <div
              v-for="(day, index) in days"
              :key="index"
              class="w-gantt__grid-day"
              :class="dayClasses(day)"
              :style="{ width: `${dayWidth}px` }"
            />
          </div>

          <div class="w-gantt__rows">
            <div
              v-for="view in rowViews"
              :key="view.row.key"
              class="w-gantt__row"
              :class="{
                'is-selected': selectedKey === view.row.key,
                'is-group': view.row.hasChildren,
              }"
              :style="{ height: `${rowHeight}px` }"
              role="row"
              :aria-rowindex="view.row.index + 2"
              :aria-level="view.row.depth + 1"
              :aria-expanded="view.row.hasChildren ? view.row.expanded : undefined"
              :aria-selected="selectedKey === view.row.key"
            >
              <div
                class="w-gantt__sidebar"
                :style="{ width: `${sidebarWidth}px` }"
                role="rowheader"
                :aria-colindex="1"
                tabindex="-1"
                @click="onSidebarClick(view.row, $event)"
                @contextmenu="onTaskContextMenu(view.row, $event)"
              >
                <div
                  class="w-gantt__sidebar-inner"
                  :style="{ paddingLeft: `${12 + view.row.depth * 18}px` }"
                >
                  <button
                    v-if="view.row.hasChildren"
                    type="button"
                    class="w-gantt__toggle"
                    :aria-label="view.row.expanded ? collapseLabel : expandLabel"
                    :aria-expanded="view.row.expanded"
                    @click.stop="toggleTask(view.row)"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      :class="{ 'is-collapsed': !view.row.expanded }"
                    >
                      <path
                        d="m4.5 6.5 3.5 3 3.5-3"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                  <span
                    v-else
                    class="w-gantt__leaf-dot"
                    :style="{ background: view.row.color }"
                    aria-hidden="true"
                  />

                  <slot
                    name="sidebar"
                    :task="view.row.task"
                    :row="view.row"
                    :depth="view.row.depth"
                    :expanded="view.row.expanded"
                    :toggle="() => toggleTask(view.row)"
                  >
                    <span class="w-gantt__task-name">{{ view.row.task.name }}</span>
                    <span v-if="view.row.hasChildren" class="w-gantt__task-count">
                      {{ view.row.task.children?.length ?? 0 }}
                    </span>
                    <span
                      v-if="view.row.task.assignee"
                      class="w-gantt__avatar"
                      :title="view.row.task.assignee"
                    >
                      {{ view.row.task.assignee.slice(0, 1) }}
                    </span>
                  </slot>
                </div>
              </div>

              <div class="w-gantt__timeline" :style="{ width: `${timelineWidth}px` }">
                <div
                  class="w-gantt__bar"
                  :class="{
                    'is-milestone': view.layout.isMilestone,
                    'is-group': view.layout.isGroup,
                    'is-compact': view.layout.width < 92,
                    'is-dragging': dragState?.row.key === view.row.key,
                    'is-draggable': canMove(view.row),
                    'is-disabled': view.row.task.disabled,
                  }"
                  :style="barStyle(view)"
                  role="gridcell"
                  :aria-colindex="2"
                  :tabindex="tabStopKey === view.row.key ? 0 : -1"
                  :data-row-key="view.row.key"
                  :aria-label="barAriaLabel(view)"
                  :aria-selected="selectedKey === view.row.key"
                  :aria-keyshortcuts="keyboardShortcuts(view.row)"
                  :title="view.title"
                  @focus="setActiveBar(view.row)"
                  @pointerdown="beginTaskDrag($event, view.row)"
                  @click.stop="onTaskClick(view.row, $event)"
                  @dblclick.stop="onTaskDblClick(view.row, $event)"
                  @contextmenu.stop="onTaskContextMenu(view.row, $event)"
                  @mouseenter="showTooltip(view.row)"
                  @mouseleave="hideTooltip"
                  @keydown="onBarKeydown($event, view.row)"
                >
                  <template v-if="view.layout.isMilestone">
                    <span class="w-gantt__milestone-diamond" aria-hidden="true" />
                    <span class="w-gantt__milestone-label">
                      <slot
                        name="task"
                        :task="view.row.task"
                        :row="view.row"
                        :start="effectiveStart(view.row)"
                        :end="effectiveEnd(view.row)"
                        :progress="view.row.progress"
                        :color="view.row.color"
                        :dragging="dragState?.row.key === view.row.key"
                      >
                        {{ view.row.task.name }}
                      </slot>
                    </span>
                  </template>

                  <template v-else>
                    <span class="w-gantt__bar-content">
                      <slot
                        name="task"
                        :task="view.row.task"
                        :row="view.row"
                        :start="effectiveStart(view.row)"
                        :end="effectiveEnd(view.row)"
                        :progress="view.row.progress"
                        :color="view.row.color"
                        :dragging="dragState?.row.key === view.row.key"
                      >
                        {{ view.row.task.name }}
                      </slot>
                    </span>
                    <span
                      v-if="showProgress && view.row.progress > 0 && view.layout.width > 110"
                      class="w-gantt__bar-percent"
                      aria-hidden="true"
                    >
                      {{ view.row.progress }}%
                    </span>
                  </template>

                  <span
                    v-if="canResize(view.row)"
                    class="w-gantt__resize-handle is-start"
                    data-w-gantt-handle="start"
                    aria-hidden="true"
                  />
                  <span
                    v-if="canResize(view.row) && view.layout.width >= 16"
                    class="w-gantt__resize-handle is-end"
                    data-w-gantt-handle="end"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>

          <svg
            v-if="showDependencies && dependencyLines.length > 0"
            class="w-gantt__dependencies"
            :width="timelineWidth"
            :height="bodyHeight"
            :style="{ left: `${sidebarWidth}px` }"
            aria-hidden="true"
          >
            <defs>
              <marker
                :id="markerId"
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 0 L 8 4 L 0 8 z" class="w-gantt__arrow-head" />
              </marker>
            </defs>
            <path
              v-for="line in dependencyLines"
              :key="line.key"
              :d="line.path"
              class="w-gantt__dependency-path"
              :marker-end="`url(#${markerId})`"
            />
          </svg>

          <div
            v-if="todayVisible"
            class="w-gantt__today-line"
            :style="{
              left: `${sidebarWidth + todayX}px`,
              height: `${bodyHeight}px`,
            }"
            :title="todayText"
            aria-hidden="true"
          >
            <span class="w-gantt__today-dot" />
          </div>

          <div
            v-if="tooltipState"
            class="w-gantt__tooltip"
            :class="`is-${tooltipState.placement}`"
            :style="{ left: `${tooltipState.left}px`, top: `${tooltipState.top}px` }"
            aria-hidden="true"
          >
            <slot
              name="tooltip"
              :task="tooltipState.row.task"
              :row="tooltipState.row"
              :start="tooltipState.row.start"
              :end="tooltipState.row.end"
              :progress="tooltipState.row.progress"
            >
              <span class="w-gantt__tooltip-title">{{ tooltipState.row.task.name }}</span>
              <span class="w-gantt__tooltip-dates">
                {{ formatters.fullDate.format(tooltipState.row.start) }}
                <template v-if="!isSameDay(tooltipState.row.start, tooltipState.row.end)">
                  — {{ formatters.fullDate.format(tooltipState.row.end) }}
                </template>
              </span>
              <span class="w-gantt__tooltip-progress">
                {{ progressText }} {{ tooltipState.row.progress }}%
              </span>
            </slot>
          </div>

          <div v-if="rows.length === 0 && !loading" class="w-gantt__empty">
            <slot name="empty" :view="view" :start-date="range.start" :end-date="range.end">
              <span>{{ emptyText }}</span>
            </slot>
          </div>
        </div>
      </div>
    </div>

    <!-- Teleported so an ancestor `transform` cannot clip the fixed menu. -->
    <Teleport to="body">
      <Transition name="w-gantt-context-menu">
        <div
          v-if="contextMenuState"
          ref="contextMenuRef"
          class="w-gantt__context-menu"
          role="menu"
          :aria-label="contextMenuState.row.task.name"
          :style="{ left: `${contextMenuState.x}px`, top: `${contextMenuState.y}px` }"
          @keydown="onContextMenuKeydown"
          @contextmenu.prevent
        >
          <slot
            name="context-menu"
            :task="contextMenuState.row.task"
            :row="contextMenuState.row"
            :close="closeContextMenu"
            :select="selectContextMenuItem"
          >
            <template v-for="item in contextMenuItems" :key="item.key">
              <div v-if="item.divider" class="w-gantt__context-menu-divider" role="separator" />
              <button
                v-else
                type="button"
                class="w-gantt__context-menu-item"
                :class="{ 'is-danger': item.danger }"
                role="menuitem"
                :disabled="item.disabled"
                @click="selectContextMenuItem(item)"
              >
                <span class="w-gantt__context-menu-label">{{ item.label }}</span>
                <span v-if="item.shortcut" class="w-gantt__context-menu-shortcut">
                  {{ item.shortcut }}
                </span>
              </button>
            </template>
          </slot>
        </div>
      </Transition>
    </Teleport>

    <div v-if="loading" class="w-gantt__loading" aria-live="polite">
      <span class="w-gantt__spinner" aria-hidden="true" />
    </div>
  </div>
</template>
