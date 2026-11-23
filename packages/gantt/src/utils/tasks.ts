import type { GanttTask, GanttTaskId } from '../types'
import { dayDiff, maxDate, minDate, parseDate, startOfDay } from './date'

export const DEFAULT_TASK_COLOR = '#4f46e5'
export const DEFAULT_GROUP_COLOR = '#4338ca'

export interface ResolvedTask {
  task: GanttTask
  key: string
  start: Date
  end: Date
  progress: number
  color: string
  children: ResolvedTask[]
  hasChildren: boolean
  dependencies: GanttTaskId[]
  parentKey: string | null
}

export interface TaskResolution {
  roots: ResolvedTask[]
  all: ResolvedTask[]
  byKey: Map<string, ResolvedTask>
}

export function taskKey(id: GanttTaskId): string {
  return `${typeof id}:${String(id)}`
}

function normalizeProgress(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.min(100, Math.max(0, value))
}

function rangeProgress(children: ResolvedTask[]): number {
  if (children.length === 0) return 0

  let totalWeight = 0
  let weighted = 0
  for (const child of children) {
    const weight = Math.max(1, dayDiff(child.end, child.start) + 1)
    totalWeight += weight
    weighted += child.progress * weight
  }

  return totalWeight > 0 ? Math.round(weighted / totalWeight) : 0
}

export function resolveTasks(tasks: GanttTask[], today = startOfDay(new Date())): TaskResolution {
  const all: ResolvedTask[] = []
  const byKey = new Map<string, ResolvedTask>()
  const seenIds = new Set<string>()

  function resolve(
    task: GanttTask,
    parentKey: string | null,
    inheritedColor: string | undefined,
  ): ResolvedTask {
    const key = taskKey(task.id)
    if (seenIds.has(key)) {
      throw new Error(`[Gantt] Duplicate task id: ${String(task.id)}`)
    }
    seenIds.add(key)

    const children = (task.children ?? []).map((child) =>
      resolve(child, key, task.color ?? inheritedColor),
    )

    const hasChildren = children.length > 0
    const explicitStart = parseDate(task.start)
    const explicitEnd = parseDate(task.end)
    const childStarts = minDate(children.map((child) => child.start))
    const childEnds = maxDate(children.map((child) => child.end))

    let start: Date
    let end: Date

    if (hasChildren) {
      start =
        minDate([explicitStart, childStarts].filter((value): value is Date => value !== null)) ??
        today
      end =
        maxDate([explicitEnd, childEnds].filter((value): value is Date => value !== null)) ?? start
    } else {
      start = explicitStart ?? explicitEnd ?? today
      end = explicitEnd ?? start
    }

    if (task.milestone && !hasChildren) {
      end = start
    }

    if (dayDiff(end, start) < 0) end = start

    const color = hasChildren
      ? (task.color ?? DEFAULT_GROUP_COLOR)
      : (task.color ?? inheritedColor ?? DEFAULT_TASK_COLOR)

    const explicitProgress = normalizeProgress(task.progress)
    const progress = explicitProgress ?? (hasChildren ? rangeProgress(children) : 0)

    const resolved: ResolvedTask = {
      task,
      key,
      start: startOfDay(start),
      end: startOfDay(end),
      progress,
      color,
      children,
      hasChildren,
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      parentKey,
    }

    all.push(resolved)
    byKey.set(key, resolved)
    return resolved
  }

  const roots = tasks.map((task) => resolve(task, null, undefined))

  return { roots, all, byKey }
}
