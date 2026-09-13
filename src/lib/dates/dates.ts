import { addDays, format, parseISO } from 'date-fns'

export const DATE_FMT = 'yyyy-MM-dd'

export const toLocalDate = (d: Date): string => format(d, DATE_FMT)

/** date-fns parseISO treats date-only strings as LOCAL midnight (native Date does not). */
export const parseLocalDate = (s: string): Date => parseISO(s)

export type DueBucket = 'overdue' | 'today' | 'week' | 'later' | 'none'

/** Pure date/time classification — callers decide how status (e.g. done) affects display. */
export function dueBucketOf(due: { dueDate?: string; dueTime?: string }, now: Date): DueBucket {
  if (!due.dueDate) return 'none'
  const today = toLocalDate(now)
  if (due.dueDate < today) return 'overdue'
  if (due.dueDate === today) {
    if (due.dueTime && due.dueTime <= format(now, 'HH:mm')) return 'overdue'
    return 'today'
  }
  if (due.dueDate <= toLocalDate(addDays(now, 7))) return 'week'
  return 'later'
}

export function isTaskOverdue(
  task: { dueDate?: string; dueTime?: string; status: string },
  now: Date,
): boolean {
  return task.status !== 'done' && dueBucketOf(task, now) === 'overdue'
}

export function formatDueLabel(dueDate: string, dueTime?: string): string {
  return format(parseLocalDate(dueDate), 'EEE d MMM') + (dueTime ? ` ${dueTime}` : '')
}

/** Compact age like "just now", "5m ago", "3h ago", "4d ago". */
export function formatAge(iso: string, now: Date): string {
  const ms = now.getTime() - Date.parse(iso)
  if (Number.isNaN(ms)) return '?'
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export interface MonthCell {
  date: string
  day: number
  inMonth: boolean
}

/** 6×7 month grid, Monday start — always 42 cells so the popover never jumps height. */
export function buildMonthGrid(year: number, monthIndex0: number): MonthCell[] {
  const first = new Date(year, monthIndex0, 1)
  const mondayOffset = (first.getDay() + 6) % 7
  const start = addDays(first, -mondayOffset)
  return Array.from({ length: 42 }, (_, i) => {
    const d = addDays(start, i)
    return { date: toLocalDate(d), day: d.getDate(), inMonth: d.getMonth() === monthIndex0 }
  })
}
