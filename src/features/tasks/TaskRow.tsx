import { Circle, CircleCheck, CircleDot } from 'lucide-react'
import type { Task } from '../../types'
import { formatDueLabel, isTaskOverdue } from '../../lib/dates/dates'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import { priorityMeta, statusMeta } from './meta'

const statusIcons = { todo: Circle, 'in-progress': CircleDot, done: CircleCheck } as const

export function TaskRow({ task, now }: { task: Task; now: Date }) {
  const updateTask = useAppStore((s) => s.updateTask)
  const openTaskEditor = useUiStore((s) => s.openTaskEditor)
  const done = task.status === 'done'
  const overdue = isTaskOverdue(task, now)
  const StatusIcon = statusIcons[task.status]
  const meta = statusMeta[task.status]
  return (
    <div
      onClick={() => openTaskEditor(task.id)}
      className="group flex cursor-pointer items-center gap-2.5 rounded-lg border border-transparent px-2 py-2 hover:border-slate-200 hover:bg-white dark:hover:border-slate-800 dark:hover:bg-slate-900"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          updateTask(task.id, { status: meta.next })
        }}
        title={`${meta.label} — click for ${statusMeta[meta.next].label.toLowerCase()}`}
        className={`shrink-0 ${meta.iconCls}`}
      >
        <StatusIcon size={18} strokeWidth={1.75} />
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${done ? 'text-slate-400 line-through dark:text-slate-500' : ''}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="truncate text-xs text-slate-400 dark:text-slate-500">{task.description}</p>
        )}
      </div>
      {task.project && (
        <span className="hidden rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500 sm:inline dark:bg-slate-800 dark:text-slate-400">
          #{task.project}
        </span>
      )}
      <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${priorityMeta[task.priority].badge}`}>
        {priorityMeta[task.priority].label}
      </span>
      {task.dueDate && (
        <span
          className={`text-xs tabular-nums ${
            overdue
              ? 'font-medium text-red-600 dark:text-red-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {formatDueLabel(task.dueDate, task.dueTime)}
        </span>
      )}
    </div>
  )
}
