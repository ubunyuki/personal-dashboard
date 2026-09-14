import { useState } from 'react'
import { Ban, Check, ChevronDown, ChevronUp, Pencil, Tag, X } from 'lucide-react'
import { Card, cardTitleCls } from '../../components/ui/Card'
import { inputCls } from '../../components/ui/Field'
import { swatchCls, tintedIconBtnCls as iconBtn } from '../../components/ui/swatches'
import { useAppStore } from '../../store/appStore'
import { GROUP_COLORS, type Task } from '../../types'
import type { ProjectSummary } from './projects'
import { TaskRow } from './TaskRow'

const titleBase = 'text-xs font-semibold tracking-wide uppercase'

/** One project's card in the grouped Tasks view — header controls mirror
 *  the bookmark GroupSection (rename, swatches, reorder), plus "untag all". */
export function ProjectSection({
  summary,
  tasks,
  first,
  last,
  now,
}: {
  summary: ProjectSummary
  tasks: Task[]
  first: boolean
  last: boolean
  now: Date
}) {
  const renameProject = useAppStore((s) => s.renameProject)
  const setProjectColor = useAppStore((s) => s.setProjectColor)
  const moveProject = useAppStore((s) => s.moveProject)
  const clearProject = useAppStore((s) => s.clearProject)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const startEdit = () => {
    setDraft(summary.name)
    setEditing(true)
  }
  const commit = () => {
    renameProject(summary.name, draft)
    setEditing(false)
  }

  return (
    <Card accent={summary.color}>
      {editing ? (
        <div className="mb-1 flex flex-col gap-2">
          <span className="flex items-center gap-1">
            <input
              className={`${inputCls} max-w-56 py-0.5 text-xs`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commit()
                }
                if (e.key === 'Escape') setEditing(false)
              }}
              autoFocus
            />
            <button type="button" title="Save name" className={iconBtn} onClick={commit}>
              <Check size={14} />
            </button>
            <button type="button" title="Done" className={iconBtn} onClick={() => setEditing(false)}>
              <X size={14} />
            </button>
            <button
              type="button"
              title="Remove this tag from all its tasks (tasks are kept)"
              className={`${iconBtn} ml-auto hover:text-red-600 dark:hover:text-red-400`}
              onClick={() => {
                clearProject(summary.name)
                setEditing(false)
              }}
            >
              <Ban size={14} />
            </button>
          </span>
          <span className="flex items-center gap-1.5 px-0.5">
            {GROUP_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => setProjectColor(summary.name, c)}
                className={`h-4 w-4 rounded-full transition-transform hover:scale-110 ${swatchCls[c]} ${
                  summary.customColor && summary.color === c
                    ? 'ring-2 ring-slate-600 dark:ring-white'
                    : ''
                }`}
              />
            ))}
            <button
              type="button"
              title="Automatic colour"
              onClick={() => setProjectColor(summary.name, undefined)}
              className={`flex h-4 w-4 items-center justify-center rounded-full border border-dashed border-slate-400 text-slate-400 transition-transform hover:scale-110 dark:border-slate-500 dark:text-slate-500 ${
                summary.customColor ? '' : 'ring-2 ring-slate-600 dark:ring-white'
              }`}
            >
              <Tag size={9} />
            </button>
          </span>
        </div>
      ) : (
        <header className="mb-1 flex items-center justify-between gap-2">
          <h3 className={`${titleBase} ${cardTitleCls[summary.color]}`}>{summary.name}</h3>
          <span className="flex items-center gap-0.5">
            <span
              className="mr-1 text-xs tabular-nums text-slate-400 dark:text-slate-500"
              title={`${summary.open} open · ${summary.done} done`}
            >
              {summary.open}/{summary.total}
            </span>
            <button
              type="button"
              title="Move project up"
              className={iconBtn}
              disabled={first}
              onClick={() => moveProject(summary.name, -1)}
            >
              <ChevronUp size={13} />
            </button>
            <button
              type="button"
              title="Move project down"
              className={iconBtn}
              disabled={last}
              onClick={() => moveProject(summary.name, 1)}
            >
              <ChevronDown size={13} />
            </button>
            <button
              type="button"
              title="Rename project / pick colour"
              className={iconBtn}
              onClick={startEdit}
            >
              <Pencil size={13} />
            </button>
          </span>
        </header>
      )}
      <div className="flex flex-col gap-0.5">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} now={now} />
        ))}
      </div>
    </Card>
  )
}
