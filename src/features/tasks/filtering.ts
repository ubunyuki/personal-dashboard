import type { Task, TaskPriority, TaskStatus } from '../../types'
import { projectsOf } from '../../lib/tasks/projectTags'
import { dueBucketOf, isDueInCalendarWeek, type DueBucket } from '../../lib/dates/dates'
import { compareDue, comparePriority } from '../../store/selectors'

/** 'open' is anything not done — the shape of "what is still on my plate",
 *  which no single TaskStatus expresses. */
export type StatusFilter = 'all' | 'open' | TaskStatus
export type PriorityFilter = 'all' | TaskPriority
/** 'calendarWeek' sits outside DueBucket on purpose: the buckets partition
 *  tasks, this cuts across them. See isDueInCalendarWeek. */
export type DueFilter = 'all' | DueBucket | 'calendarWeek'
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

/** The view the Tasks page opens on, and what its "clear" state means. */
export const defaultTaskView = (): TaskView => ({
  status: 'all',
  priority: 'all',
  due: 'all',
  sort: 'due',
  project: 'all',
  group: 'none',
})

export function applyTaskView(
  tasks: Task[],
  view: TaskView,
  now: Date,
  weekStartsOn: 0 | 1,
): Task[] {
  const filtered = tasks.filter((t) => {
    if (view.status === 'open') {
      if (t.status === 'done') return false
    } else if (view.status !== 'all' && t.status !== view.status) return false
    if (view.priority !== 'all' && t.priority !== view.priority) return false
    if (view.due === 'calendarWeek') {
      if (!isDueInCalendarWeek(t, now, weekStartsOn)) return false
    } else if (view.due !== 'all' && dueBucketOf(t, now) !== view.due) return false
    if (view.project === 'untagged') {
      if (projectsOf(t).length > 0) return false
    } else if (view.project !== 'all' && !projectsOf(t).includes(view.project)) {
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
