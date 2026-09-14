import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { inputCls } from '../../components/ui/Field'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

const HEIGHT_KEY = 'pwd:note-height'
/** ~7 lines of text-sm plus padding. */
const DEFAULT_HEIGHT = 168
/** Matches the textarea's min-h-20 (5rem). */
const MIN_HEIGHT = 80

const maxHeight = () => Math.round(window.innerHeight * 0.6)

function readStoredHeight(): number {
  try {
    const n = Number(localStorage.getItem(HEIGHT_KEY))
    if (Number.isFinite(n) && n >= MIN_HEIGHT) return Math.min(n, maxHeight())
  } catch {
    // localStorage unavailable — fall through to the default.
  }
  return DEFAULT_HEIGHT
}

export function NoteCapture() {
  const addNote = useAppStore((s) => s.addNote)
  const focusToken = useUiStore((s) => s.noteFocusToken)
  const text = useUiStore((s) => s.noteDraft)
  const setText = useUiStore((s) => s.setNoteDraft)
  const ref = useRef<HTMLTextAreaElement>(null)
  // Height lives on the element (drag handle below); React only sets the start value.
  const [height] = useState(readStoredHeight)

  useEffect(() => {
    if (focusToken > 0) ref.current?.focus()
  }, [focusToken])

  // Remember the height the user drags the box to. Deliberately plain
  // localStorage: a per-device ergonomic pref, not backed-up app data.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let timer = 0
    const observer = new ResizeObserver(() => {
      const h = Math.round(el.offsetHeight)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (h < MIN_HEIGHT || h === readStoredHeight()) return
        try {
          localStorage.setItem(HEIGHT_KEY, String(h))
        } catch {
          // Best-effort only.
        }
      }, 300)
    })
    observer.observe(el)
    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  // Full-width resize bar: a much bigger target than the browser's native
  // corner grip, and it works from anywhere along the bottom edge.
  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    e.preventDefault()
    const startY = e.clientY
    const startH = el.offsetHeight
    const handle = e.currentTarget
    handle.setPointerCapture(e.pointerId)
    const onMove = (ev: PointerEvent) => {
      const h = Math.min(maxHeight(), Math.max(MIN_HEIGHT, startH + (ev.clientY - startY)))
      el.style.height = `${h}px`
    }
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', onUp)
      handle.removeEventListener('pointercancel', onUp)
    }
    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onUp)
    handle.addEventListener('pointercancel', onUp)
  }

  const save = () => {
    const t = text.trim()
    if (!t) return
    addNote(t)
    setText('')
    ref.current?.focus()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col">
        <textarea
          ref={ref}
          className={`${inputCls} max-h-[60vh] min-h-20 resize-none overflow-auto`}
          style={{ height }}
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
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize note box"
          title="Drag to resize"
          onPointerDown={startDrag}
          className="group flex h-3.5 w-full cursor-ns-resize touch-none items-center justify-center"
        >
          <span className="h-1 w-16 rounded-full bg-slate-300 transition-colors group-hover:bg-slate-400 dark:bg-slate-600 dark:group-hover:bg-slate-500" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          First line becomes the title if you convert it to a task. Drag the bar to resize.
        </span>
        <Button variant="primary" onClick={save} disabled={!text.trim()}>
          Save note
        </Button>
      </div>
    </div>
  )
}
