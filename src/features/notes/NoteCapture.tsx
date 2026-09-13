import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { inputCls } from '../../components/ui/Field'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

export function NoteCapture() {
  const addNote = useAppStore((s) => s.addNote)
  const focusToken = useUiStore((s) => s.noteFocusToken)
  const ref = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState('')

  useEffect(() => {
    if (focusToken > 0) ref.current?.focus()
  }, [focusToken])

  const save = () => {
    const t = text.trim()
    if (!t) return
    addNote(t)
    setText('')
    ref.current?.focus()
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        ref={ref}
        rows={3}
        className={inputCls}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            save()
          }
        }}
        placeholder="Jot something — meeting points, a sudden ask from your manager… (Ctrl+Enter to save)"
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          First line becomes the title if you convert it to a task.
        </span>
        <Button variant="primary" onClick={save} disabled={!text.trim()}>
          Save note
        </Button>
      </div>
    </div>
  )
}
