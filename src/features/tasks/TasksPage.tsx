import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { inputCls } from '../../components/ui/Field'
import { useNow } from '../../lib/useNow'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import { applyTaskView, type StatusFilter, type TaskView } from './filtering'
import { deriveProjects, groupTasksByProject } from './projects'
import { ProjectChips } from './ProjectChips'
import { ProjectSection } from './ProjectSection'
import { TaskFilters } from './TaskFilters'
import { TaskRow } from './TaskRow'

export function TasksPage() {
  const tasks = useAppStore((s) => s.tasks)
  const projectMeta = useAppStore((s) => s.projectMeta)
  const addTask = useAppStore((s) => s.addTask)
  const openTaskEditor = useUiStore((s) => s.openTaskEditor)
  const now = useNow()
  const [quickTitle, setQuickTitle] = useState('')
  const [view, setView] = useState<TaskView>({
    status: 'all',
    priority: 'all',
    due: 'all',
    sort: 'due',
    project: 'all',
    group: 'none',
  })

  const projects = useMemo(() => deriveProjects(tasks, projectMeta), [tasks, projectMeta])
  // A project filter can outlive its project (last task untagged or renamed
  // away) — fall back to 'all' at render time instead of a state write.
  const effectiveView = useMemo<TaskView>(
    () =>
      view.project === 'all' ||
      view.project === 'untagged' ||
      projects.some((p) => p.name === view.project)
        ? view
        : { ...view, project: 'all' },
    [view, projects],
  )
  const visible = useMemo(
    () => applyTaskView(tasks, effectiveView, now),
    [tasks, effectiveView, now],
  )
  const groups = useMemo(
    () =>
      effectiveView.group === 'project'
        ? groupTasksByProject(visible, tasks, projectMeta)
        : null,
    [effectiveView.group, visible, tasks, projectMeta],
  )
  const untaggedOpen = useMemo(
    () => tasks.filter((t) => !t.project && t.status !== 'done').length,
    [tasks],
  )
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
      {projects.length > 0 && (
        <ProjectChips
          projects={projects}
          untaggedOpen={untaggedOpen}
          view={effectiveView}
          onChange={setView}
        />
      )}
      <TaskFilters view={effectiveView} onChange={setView} counts={counts} />
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
      ) : groups !== null ? (
        <div className="flex flex-col gap-3">
          {groups.map((g) =>
            g.project !== null ? (
              <ProjectSection
                key={g.project.name}
                summary={g.project}
                tasks={g.tasks}
                // Position in the FULL derived order, so the move buttons
                // stay honest even when filters hide neighbouring sections.
                first={projects[0]?.name === g.project.name}
                last={projects.at(-1)?.name === g.project.name}
                now={now}
              />
            ) : (
              <Card key="untagged" accent="neutral" title="No project" right={g.tasks.length}>
                <div className="flex flex-col gap-0.5">
                  {g.tasks.map((t) => (
                    <TaskRow key={t.id} task={t} now={now} />
                  ))}
                </div>
              </Card>
            ),
          )}
        </div>
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
