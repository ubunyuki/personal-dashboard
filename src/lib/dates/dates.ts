import { addDays, endOfWeek, format, parseISO, startOfWeek } from 'date-fns'
import { HK_HOLIDAYS } from './hkHolidays'

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

/** Due inside the CURRENT calendar week — Monday-to-Sunday or Sunday-to-
 *  Saturday per `weekStartsOn`. Deliberately NOT the same as dueBucketOf's
 *  'week', which is a rolling seven days from now: on a Friday the rolling
 *  window reaches into next week, and "due this week" should not. Includes
 *  days already past in this week, since a task due on Monday is still part
 *  of this week's load. Not a DueBucket member — that union is a partition
 *  and this overlaps 'overdue', 'today' and 'week' at once.
 *
 *  Both the dashboard metric and the Tasks quick filter call this, so the
 *  count on the tile and the list it opens can never disagree. */
export function isDueInCalendarWeek(
  due: { dueDate?: string },
  now: Date,
  weekStartsOn: 0 | 1,
): boolean {
  if (!due.dueDate) return false
  return (
    due.dueDate >= toLocalDate(startOfWeek(now, { weekStartsOn })) &&
    due.dueDate <= toLocalDate(endOfWeek(now, { weekStartsOn }))
  )
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
  /** 0 = Sunday … 6 = Saturday. Carried on the cell so callers style by real
   *  day-of-week rather than by column, which moves with weekStartsOn. */
  weekday: number
}

/** Official English name of the HK public holiday on a local 'yyyy-MM-dd'.
 *  Undefined outside the bundled years means "not known", not "not a holiday"
 *  — see HK_HOLIDAY_YEARS. */
export function hkHolidayName(date: string): string | undefined {
  return HK_HOLIDAYS[date]
}

/** 6×7 month grid — always 42 cells so the popover never jumps height.
 *  `weekStartsOn`: 0 = Sunday, 1 = Monday. Required, so no call site can
 *  silently drift from the user's setting. */
export function buildMonthGrid(
  year: number,
  monthIndex0: number,
  weekStartsOn: 0 | 1,
): MonthCell[] {
  const first = new Date(year, monthIndex0, 1)
  const lead = (first.getDay() - weekStartsOn + 7) % 7
  const start = addDays(first, -lead)
  return Array.from({ length: 42 }, (_, i) => {
    const d = addDays(start, i)
    return {
      date: toLocalDate(d),
      day: d.getDate(),
      inMonth: d.getMonth() === monthIndex0,
      weekday: d.getDay(),
    }
  })
}
