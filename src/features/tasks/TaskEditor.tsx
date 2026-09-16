import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Drawer } from '../../components/ui/Drawer'
import { Field, inputCls } from '../../components/ui/Field'
import {
  allProjectTags,
  formatProjectTags,
  parseProjectTags,
} from '../../lib/tasks/projectTags'
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
  const [project, setProject] = useState(formatProjectTags(task?.projects))

  if (!editing) return null
  if (editing !== 'new' && !task) return null

  const head = project.slice(0, project.lastIndexOf(',') + 1)
  const already = new Set((parseProjectTags(head) ?? []).map((p) => p.toLowerCase()))
  const tagSuggestions = allProjectTags(tasks)
    .filter((tag) => !already.has(tag.toLowerCase()))
    .map((tag) => (head ? `${head} ${tag}` : tag))

  const save = () => {
    const fields = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate || undefined,
      dueTime: dueDate && dueTime ? dueTime : undefined,
      projects: parseProjectTags(project),
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
    <Drawer title={editing === 'new' ? 'New task' : 'Edit task'} onClose={close}>
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
        <Field label="Project tags">
          <input
            className={inputCls}
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="e.g. website-revamp, q4-budget"
            list="project-tag-options"
          />
        </Field>
        {/* Existing tags as suggestions — free text still allowed. Picking an
            option replaces the WHOLE field, so each one carries the tags
            already typed and only completes the segment after the last comma. */}
        <datalist id="project-tag-options">
          {tagSuggestions.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
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
    </Drawer>
  )
}
