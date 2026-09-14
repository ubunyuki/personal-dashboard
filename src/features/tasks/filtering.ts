import type { Task, TaskPriority, TaskStatus } from '../../types'
import { dueBucketOf, type DueBucket } from '../../lib/dates/dates'
import { compareDue, comparePriority } from '../../store/selectors'

export type StatusFilter = 'all' | TaskStatus
export type PriorityFilter = 'all' | TaskPriority
export type DueFilter = 'all' | DueBucket
export type TaskSort = 'due' | 'priority' | 'updated'
/** 'all' and 'untagged' are sentinels (same convention as StatusFilter);
 *  any other value is a literal project tag. */
export type ProjectFilter = string
export type TaskGrouping = 'none' | 'project'

export interface TaskView {
  status: StatusFilter
  priority: PriorityFilter
  due: DueFilter
  sort: TaskSort
  project: ProjectFilter
  group: TaskGrouping
}

export function applyTaskView(tasks: Task[], view: TaskView, now: Date): Task[] {
  const filtered = tasks.filter((t) => {
    if (view.status !== 'all' && t.status !== view.status) return false
    if (view.priority !== 'all' && t.priority !== view.priority) return false
    if (view.due !== 'all' && dueBucketOf(t, now) !== view.due) return false
    if (view.project === 'untagged') {
      if (t.project !== undefined) return false
    } else if (view.project !== 'all' && t.project !== view.project) {
      return false
    }
    return true
  })
  const cmp: Record<TaskSort, (a: Task, b: Task) => number> = {
    due: compareDue,
    priority: comparePriority,
    updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  }
  return [...filtered].sort(cmp[view.sort])
}
