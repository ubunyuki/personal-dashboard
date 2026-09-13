import type { TaskPriority, TaskStatus } from '../../types'

export const statusMeta: Record<TaskStatus, { label: string; next: TaskStatus; iconCls: string }> =
  {
    todo: {
      label: 'To do',
      next: 'in-progress',
      iconCls: 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
    },
    'in-progress': {
      label: 'In progress',
      next: 'done',
      iconCls: 'text-indigo-500 hover:text-indigo-600',
    },
    done: { label: 'Done', next: 'todo', iconCls: 'text-emerald-500 hover:text-emerald-600' },
  }

export const priorityMeta: Record<TaskPriority, { label: string; badge: string }> = {
  high: { label: 'High', badge: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' },
  medium: {
    label: 'Med',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  low: { label: 'Low', badge: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
}
