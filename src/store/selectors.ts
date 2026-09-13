import { isAfter, parseISO, startOfWeek } from 'date-fns'
import type { Task, TaskPriority } from '../types'
import { dueBucketOf, type DueBucket } from '../lib/dates/dates'

const priorityRank: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }

/** Sortable key: dated tasks first (chronological), undated last. */
const dueKey = (t: Task): string =>
  t.dueDate ? `${t.dueDate} ${t.dueTime ?? '99:99'}` : '9999-99-99'

export const compareDue = (a: Task, b: Task): number =>
  dueKey(a).localeCompare(dueKey(b)) || priorityRank[a.priority] - priorityRank[b.priority]

export const comparePriority = (a: Task, b: Task): number =>
  priorityRank[a.priority] - priorityRank[b.priority] || dueKey(a).localeCompare(dueKey(b))

export interface TaskBuckets {
  overdue: Task[]
  dueToday: Task[]
  dueWeek: Task[]
  inProgress: Task[]
}

export function taskBuckets(tasks: Task[], now: Date): TaskBuckets {
  const open = tasks.filter((t) => t.status !== 'done')
  const bucket = (b: DueBucket) => open.filter((t) => dueBucketOf(t, now) === b).sort(compareDue)
  return {
    overdue: bucket('overdue'),
    dueToday: bucket('today'),
    dueWeek: bucket('week'),
    inProgress: tasks
      .filter((t) => t.status === 'in-progress')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  }
}

export interface Metrics {
  open: number
  doneThisWeek: number
  overdue: number
}

export function metrics(tasks: Task[], now: Date): Metrics {
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  return {
    open: tasks.filter((t) => t.status !== 'done').length,
    doneThisWeek: tasks.filter(
      (t) => t.completedAt && isAfter(parseISO(t.completedAt), weekStart),
    ).length,
    overdue: taskBuckets(tasks, now).overdue.length,
  }
}
