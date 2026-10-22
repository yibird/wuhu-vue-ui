import { describe, expect, it } from 'vite-plus/test'
import type { GanttTask } from '../types'
import { addDays, addMonths, dayDiff, isWeekend, parseDate, startOfWeek } from '../utils/date'
import { resolveTasks, taskKey } from '../utils/tasks'

const today = new Date(2026, 9, 19)

describe('Gantt date utilities', () => {
  it('adds calendar days across month boundaries', () => {
    expect(dayDiff(addDays(today, 1), today)).toBe(1)
    expect(addDays(new Date(2026, 9, 31), 1).getMonth()).toBe(10)
  })

  it('clamps month arithmetic to the last day of the month', () => {
    const result = addMonths(new Date(2026, 0, 31), 1)
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(1)
    expect(result.getDate()).toBe(28)
  })

  it('starts weeks on the configured day', () => {
    const wednesday = new Date(2026, 9, 21)
    expect(startOfWeek(wednesday, 1).getDate()).toBe(19)
    expect(startOfWeek(wednesday, 0).getDate()).toBe(18)
  })

  it('detects weekends', () => {
    expect(isWeekend(new Date(2026, 9, 18))).toBe(true)
    expect(isWeekend(new Date(2026, 9, 19))).toBe(false)
  })

  it('parses ISO datetime strings as calendar dates', () => {
    const date = parseDate('2026-10-01T23:30:00Z')
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(9)
    expect(date?.getDate()).toBe(1)
  })

  it('rejects invalid calendar dates instead of rolling them over', () => {
    expect(parseDate('2026-13-40')).toBeNull()
    expect(parseDate('2026-02-30')).toBeNull()
  })
})

describe('resolveTasks', () => {
  const tasks: GanttTask[] = [
    {
      id: 'group',
      name: 'Group',
      color: '#123456',
      children: [
        {
          id: 'a',
          name: 'A',
          start: '2026-10-01',
          end: '2026-10-02',
          progress: 100,
        },
        {
          id: 'b',
          name: 'B',
          start: '2026-10-03',
          end: '2026-10-06',
          progress: 0,
        },
      ],
    },
  ]

  it('derives group dates from children', () => {
    const { roots } = resolveTasks(tasks, today)
    expect(roots[0]?.start.getDate()).toBe(1)
    expect(roots[0]?.end.getDate()).toBe(6)
  })

  it('calculates duration-weighted group progress', () => {
    const { roots } = resolveTasks(tasks, today)
    expect(roots[0]?.progress).toBe(33)
  })

  it('inherits an explicit group color', () => {
    const { roots } = resolveTasks(tasks, today)
    expect(roots[0]?.children[0]?.color).toBe('#123456')
  })

  it('turns milestones into single-day ranges', () => {
    const { roots } = resolveTasks(
      [{ id: 'm', name: 'M', start: '2026-10-20', milestone: true }],
      today,
    )
    expect(dayDiff(roots[0]!.end, roots[0]!.start)).toBe(0)
  })

  it('falls back to today for tasks without dates', () => {
    const { roots } = resolveTasks([{ id: 'x', name: 'X' }], today)
    expect(roots[0]?.start.getTime()).toBe(today.getTime())
    expect(roots[0]?.end.getTime()).toBe(today.getTime())
  })

  it('creates stable typed keys', () => {
    expect(taskKey(1)).toBe('number:1')
    expect(taskKey('1')).toBe('string:1')
    expect(taskKey(1)).not.toBe(taskKey('1'))
  })

  it('fails fast on duplicate task ids', () => {
    expect(() =>
      resolveTasks(
        [
          { id: 'dup', name: 'One', start: '2026-10-01' },
          { id: 'dup', name: 'Two', start: '2026-10-02' },
        ],
        today,
      ),
    ).toThrow('Duplicate task id')
  })
})
