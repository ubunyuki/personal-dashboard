import { statusMeta } from './meta'
import type { DueFilter, PriorityFilter, StatusFilter, TaskSort, TaskView } from './filtering'

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'todo', label: statusMeta.todo.label },
  { value: 'in-progress', label: statusMeta['in-progress'].label },
  { value: 'done', label: statusMeta.done.label },
]

const selectCls =
  'rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'

export function TaskFilters({
  view,
  onChange,
  counts,
}: {
  view: TaskView
  onChange: (view: TaskView) => void
  counts: Record<StatusFilter, number>
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        {statusOptions.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange({ ...view, status: o.value })}
            className={`rounded-md px-2 py-1 text-xs ${
              view.status === o.value
                ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {o.label} <span className="opacity-60">{counts[o.value]}</span>
          </button>
        ))}
      </div>
      {/* One-click "what's on for this week", the same cut the dashboard
          metric counts. A toggle rather than a third state in the due select,
          because it is the filter reached for most often. */}
      <button
        type="button"
        onClick={() =>
          onChange({ ...view, due: view.due === 'calendarWeek' ? 'all' : 'calendarWeek' })
        }
        className={`rounded-md px-2 py-1 text-xs ${
          view.due === 'calendarWeek'
            ? 'bg-sky-50 font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300'
            : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
        }`}
      >
        Due this week
      </button>
      <div className="ml-auto flex items-center gap-2">
        <select
          className={selectCls}
          value={view.priority}
          onChange={(e) => onChange({ ...view, priority: e.target.value as PriorityFilter })}
        >
          <option value="all">Priority: all</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          className={selectCls}
          value={view.due}
          onChange={(e) => onChange({ ...view, due: e.target.value as DueFilter })}
        >
          <option value="all">Due: all</option>
          <option value="overdue">Overdue</option>
          <option value="today">Today</option>
          <option value="week">Next 7 days</option>
          <option value="calendarWeek">This week</option>
          <option value="later">Later</option>
          <option value="none">No date</option>
        </select>
        <select
          className={selectCls}
          value={view.sort}
          onChange={(e) => onChange({ ...view, sort: e.target.value as TaskSort })}
        >
          <option value="due">Sort: due date</option>
          <option value="priority">Sort: priority</option>
          <option value="updated">Sort: updated</option>
        </select>
      </div>
    </div>
  )
}
