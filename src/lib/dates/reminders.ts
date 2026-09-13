import { addDays } from 'date-fns'
import type { CalEvent, Task } from '../../types'
import { compareDue } from '../../store/selectors'
import { dueBucketOf, toLocalDate } from './dates'

export interface Reminders {
  overdue: Task[]
  /** Due today (and not yet overdue) or due tomorrow. */
  dueSoon: Task[]
  todayEvents: CalEvent[]
  count: number
}

export function deriveReminders(tasks: Task[], events: CalEvent[], now: Date): Reminders {
  const today = toLocalDate(now)
  const tomorrow = toLocalDate(addDays(now, 1))
  const open = tasks.filter((t) => t.status !== 'done')
  const overdue = open.filter((t) => dueBucketOf(t, now) === 'overdue').sort(compareDue)
  const dueSoon = open
    .filter(
      (t) =>
        (t.dueDate === today && dueBucketOf(t, now) === 'today') || t.dueDate === tomorrow,
    )
    .sort(compareDue)
  const todayEvents = [...events]
    .filter((e) => e.date === today)
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  return {
    overdue,
    dueSoon,
    todayEvents,
    count: overdue.length + dueSoon.length + todayEvents.length,
  }
}
