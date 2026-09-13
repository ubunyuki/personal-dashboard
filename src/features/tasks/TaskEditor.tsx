import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Field, inputCls } from '../../components/ui/Field'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import type { TaskPriority, TaskStatus } from '../../types'

export function TaskEditor() {
  const editing = useUiStore((s) => s.editingTask)
  const close = useUiStore((s) => s.closeTaskEditor)
  const tasks = useAppStore((s) => s.tasks)
  const addTask = useAppStore((s) => s.addTask)
  const updateTask = useAppStore((s) => s.updateTask)
  const deleteTask = useAppStore((s) => s.deleteTask)

  const task = editing && editing !== 'new' ? tasks.find((t) => t.id === editing) : undefined

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const [dueTime, setDueTime] = useState(task?.dueTime ?? '')
  const [project, setProject] = useState(task?.project ?? '')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  if (!editing) return null
  if (editing !== 'new' && !task) return null

  const save = () => {
    const fields = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate || undefined,
      dueTime: dueDate && dueTime ? dueTime : undefined,
      project: project.trim() || undefined,
    }
    if (!fields.title) return
    if (editing === 'new') addTask(fields)
    else updateTask(editing, fields)
    close()
  }

  const remove = () => {
    if (editing !== 'new' && window.confirm('Delete this task?')) {
      deleteTask(editing)
      close()
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-slate-900/30 dark:bg-black/50" onClick={close} />
      <aside className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold">{editing === 'new' ? 'New task' : 'Edit task'}</h2>
          <button
            type="button"
            onClick={close}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={16} />
          </button>
        </header>
        <form
          className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <Field label="Title">
            <input
              autoFocus
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
            />
          </Field>
          <Field label="Description">
            <textarea
              rows={4}
              className={inputCls}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details, links, context…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                className={inputCls}
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </Field>
            <Field label="Priority">
              <select
                className={inputCls}
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </Field>
            <Field label="Due date">
              <input
                type="date"
                className={inputCls}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
            <Field label="Due time">
              <input
                type="time"
                className={inputCls}
                value={dueTime}
                disabled={!dueDate}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Project tag">
            <input
              className={inputCls}
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g. website-revamp"
            />
          </Field>
          <div className="mt-auto flex items-center gap-2 pt-2">
            <Button variant="primary" type="submit" disabled={!title.trim()}>
              {editing === 'new' ? 'Add task' : 'Save changes'}
            </Button>
            <Button onClick={close}>Cancel</Button>
            {editing !== 'new' && (
              <Button variant="danger" className="ml-auto" onClick={remove}>
                Delete
              </Button>
            )}
          </div>
        </form>
      </aside>
    </div>
  )
}
