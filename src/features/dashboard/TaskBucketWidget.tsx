import type { Task } from '../../types'
import { useUiStore } from '../../store/uiStore'
import { TaskRow } from '../tasks/TaskRow'

export function TaskBucketWidget({
  title,
  tasks,
  now,
  emptyText,
}: {
  title: string
  tasks: Task[]
  now: Date
  emptyText: string
}) {
  const setActiveTab = useUiStore((s) => s.setActiveTab)
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <header className="mb-1 flex items-baseline justify-between">
        <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          {title}
        </h3>
        <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500">
          {tasks.length}
        </span>
      </header>
      {tasks.length === 0 ? (
        <p className="py-2 text-sm text-slate-400 dark:text-slate-500">{emptyText}</p>
      ) : (
        <div className="flex flex-col">
          {tasks.slice(0, 6).map((t) => (
            <TaskRow key={t.id} task={t} now={now} />
          ))}
          {tasks.length > 6 && (
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className="mt-1 self-start rounded-md px-2 py-0.5 text-xs text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
            >
              View all {tasks.length} →
            </button>
          )}
        </div>
      )}
    </section>
  )
}
