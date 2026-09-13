import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { inputCls } from '../../components/ui/Field'
import { useNow } from '../../lib/useNow'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import { applyTaskView, type StatusFilter, type TaskView } from './filtering'
import { TaskFilters } from './TaskFilters'
import { TaskRow } from './TaskRow'

export function TasksPage() {
  const tasks = useAppStore((s) => s.tasks)
  const addTask = useAppStore((s) => s.addTask)
  const openTaskEditor = useUiStore((s) => s.openTaskEditor)
  const now = useNow()
  const [quickTitle, setQuickTitle] = useState('')
  const [view, setView] = useState<TaskView>({
    status: 'all',
    priority: 'all',
    due: 'all',
    sort: 'due',
  })

  const visible = useMemo(() => applyTaskView(tasks, view, now), [tasks, view, now])
  const counts = useMemo<Record<StatusFilter, number>>(
    () => ({
      all: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      'in-progress': tasks.filter((t) => t.status === 'in-progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
    }),
    [tasks],
  )

  const quickAdd = () => {
    const title = quickTitle.trim()
    if (!title) return
    addTask({ title })
    setQuickTitle('')
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-3 px-4 py-4">
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          quickAdd()
        }}
      >
        <input
          className={inputCls}
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Add a task — Enter to save"
        />
        <Button variant="primary" type="submit" disabled={!quickTitle.trim()}>
          Add
        </Button>
        <Button onClick={() => openTaskEditor()} title="New task with details" className="shrink-0">
          <Plus size={16} />
        </Button>
      </form>
      <TaskFilters view={view} onChange={setView} counts={counts} />
      {visible.length === 0 ? (
        tasks.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            hint="Add your first task above — deadlines, priority and project tag live behind the + button or a click on any task."
          />
        ) : (
          <EmptyState
            title="Nothing matches these filters"
            hint="Adjust the status, priority or due filters above."
          />
        )
      ) : (
        <div className="flex flex-col gap-0.5">
          {visible.map((t) => (
            <TaskRow key={t.id} task={t} now={now} />
          ))}
        </div>
      )}
    </div>
  )
}
