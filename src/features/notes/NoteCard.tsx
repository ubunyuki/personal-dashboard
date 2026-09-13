import { useState } from 'react'
import { ArrowRight, Pencil, SquareCheck, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { parseISO } from 'date-fns'
import type { Note } from '../../types'
import { inputCls } from '../../components/ui/Field'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

const actionCls =
  'flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'

export function NoteCard({ note }: { note: Note }) {
  const updateNote = useAppStore((s) => s.updateNote)
  const deleteNote = useAppStore((s) => s.deleteNote)
  const convertNoteToTask = useAppStore((s) => s.convertNoteToTask)
  const openTaskEditor = useUiStore((s) => s.openTaskEditor)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.text)

  const startEdit = () => {
    setDraft(note.text)
    setEditing(true)
  }
  const saveEdit = () => {
    const t = draft.trim()
    if (t && t !== note.text) updateNote(note.id, t)
    setEditing(false)
  }
  const convert = () => {
    const task = convertNoteToTask(note.id)
    if (task) openTaskEditor(task.id)
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      {editing ? (
        <textarea
          autoFocus
          rows={Math.min(10, Math.max(3, draft.split('\n').length))}
          className={inputCls}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              saveEdit()
            }
            if (e.key === 'Escape') {
              e.stopPropagation()
              setDraft(note.text)
              setEditing(false)
            }
          }}
        />
      ) : (
        <p
          onClick={startEdit}
          className="cursor-text text-sm whitespace-pre-wrap text-slate-800 dark:text-slate-200"
        >
          {note.text}
        </p>
      )}
      <footer className="mt-2 flex items-center gap-1.5">
        <span className="mr-auto text-[11px] text-slate-400 dark:text-slate-500">
          {format(parseISO(note.createdAt), 'd MMM HH:mm')}
        </span>
        {note.convertedToTaskId ? (
          <button
            type="button"
            className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
            onClick={() => openTaskEditor(note.convertedToTaskId)}
            title="Open the task created from this note"
          >
            <SquareCheck size={12} /> Task created — open
          </button>
        ) : (
          <button type="button" className={actionCls} onClick={convert} title="First line → title, rest → description">
            <ArrowRight size={12} /> Convert to task
          </button>
        )}
        <button type="button" className={actionCls} onClick={startEdit}>
          <Pencil size={12} /> Edit
        </button>
        <button
          type="button"
          className={`${actionCls} hover:!text-red-600 dark:hover:!text-red-400`}
          onClick={() => {
            if (window.confirm('Delete this note?')) deleteNote(note.id)
          }}
        >
          <Trash2 size={12} /> Delete
        </button>
      </footer>
    </article>
  )
}
