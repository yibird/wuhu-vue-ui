export type DateLike = Date | string | number

const MS_PER_DAY = 86_400_000

export function parseDate(value: DateLike | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : startOfDay(value)
  }

  if (typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : startOfDay(date)
  }

  const calendarDate = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/.exec(value)
  if (calendarDate) {
    const year = Number(calendarDate[1])
    const month = Number(calendarDate[2])
    const day = Number(calendarDate[3])
    const date = new Date(year, month - 1, day)
    if (
      Number.isNaN(date.getTime()) ||
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null
    }
    return startOfDay(date)
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : startOfDay(date)
}

export function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

export function addDays(value: Date, amount: number): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate() + amount)
}

export function addMonths(value: Date, amount: number): Date {
  const target = new Date(value.getFullYear(), value.getMonth() + amount, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(value.getDate(), lastDay))
  return startOfDay(target)
}

export function startOfWeek(value: Date, weekStartsOn = 1): Date {
  const day = value.getDay()
  const diff = (day - weekStartsOn + 7) % 7
  return addDays(startOfDay(value), -diff)
}

export function startOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

export function endOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0)
}

export function daySerial(value: Date): number {
  return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / MS_PER_DAY
}

/** Calendar-day difference: positive when `a` is after `b`. */
export function dayDiff(a: Date, b: Date): number {
  return daySerial(a) - daySerial(b)
}

export function isSameDay(a: Date, b: Date): boolean {
  return daySerial(a) === daySerial(b)
}

export function isWeekend(value: Date): boolean {
  const day = value.getDay()
  return day === 0 || day === 6
}

export function minDate(values: Date[]): Date | null {
  if (values.length === 0) return null
  return values.reduce((min, value) => (daySerial(value) < daySerial(min) ? value : min))
}

export function maxDate(values: Date[]): Date | null {
  if (values.length === 0) return null
  return values.reduce((max, value) => (daySerial(value) > daySerial(max) ? value : max))
}

export function eachDay(start: Date, end: Date): Date[] {
  const days: Date[] = []
  let cursor = startOfDay(start)
  const last = startOfDay(end)

  while (daySerial(cursor) <= daySerial(last)) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }

  return days
}
