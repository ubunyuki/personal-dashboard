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
