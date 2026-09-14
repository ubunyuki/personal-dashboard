import type { Task } from '../../types'
import { Card } from '../../components/ui/Card'
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
    <Card accent="tasks" title={title} right={tasks.length}>
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
    </Card>
  )
}
