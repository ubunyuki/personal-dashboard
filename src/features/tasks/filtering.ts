import type { Task, TaskPriority, TaskStatus } from '../../types'
import { dueBucketOf, type DueBucket } from '../../lib/dates/dates'

export type StatusFilter = 'all' | TaskStatus
export type PriorityFilter = 'all' | TaskPriority
export type DueFilter = 'all' | DueBucket
export type TaskSort = 'due' | 'priority' | 'updated'

export interface TaskView {
  status: StatusFilter
  priority: PriorityFilter
  due: DueFilter
  sort: TaskSort
}

const priorityRank: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }

/** Sortable key: dated tasks first (chronological), undated last. */
const dueKey = (t: Task): string => (t.dueDate ? `${t.dueDate} ${t.dueTime ?? '99:99'}` : '9999-99-99')

export function applyTaskView(tasks: Task[], view: TaskView, now: Date): Task[] {
  const filtered = tasks.filter((t) => {
    if (view.status !== 'all' && t.status !== view.status) return false
    if (view.priority !== 'all' && t.priority !== view.priority) return false
    if (view.due !== 'all' && dueBucketOf(t, now) !== view.due) return false
    return true
  })
  const cmp: Record<TaskSort, (a: Task, b: Task) => number> = {
    due: (a, b) =>
      dueKey(a).localeCompare(dueKey(b)) || priorityRank[a.priority] - priorityRank[b.priority],
    priority: (a, b) =>
      priorityRank[a.priority] - priorityRank[b.priority] || dueKey(a).localeCompare(dueKey(b)),
    updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  }
  return [...filtered].sort(cmp[view.sort])
}
