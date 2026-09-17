import { useMemo } from 'react'
import { Pin } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { pinnedNotes } from '../notes/ordering'
import { useClamp } from '../../lib/useClamp'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import type { Note } from '../../types'

/**
 * Pinned notes, shown at length rather than as one-line summaries: the point
 * of pinning is to READ the note from the dashboard. Long ones clamp to a few
 * lines behind "See more" so a single essay cannot push the rest of the
 * dashboard off-screen. Renders nothing at all when nothing is pinned, so the
 * tile costs the dashboard nothing until it is used.
 */
function PinnedNote({ note }: { note: Note }) {
  const focusNote = useUiStore((s) => s.focusNote)
  const { ref, expanded, overflows, toggle } = useClamp<HTMLButtonElement>(note.text)
  return (
    <div className="rounded-lg hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30">
      {/* The text itself is the jump target, so "See more" has to sit beside
          it rather than inside it — a button within a button is invalid. */}
      <button
        ref={ref}
        type="button"
        onClick={() => focusNote(note.id)}
        title="Open in Notes"
        className={`block w-full px-2 pt-1.5 text-left text-sm whitespace-pre-wrap ${
          expanded ? 'line-clamp-none' : 'line-clamp-4'
        }`}
      >
        {note.text}
      </button>
      {overflows && (
        <button
          type="button"
          onClick={toggle}
          className="mb-1.5 ml-2 rounded text-[11px] font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          {expanded ? 'See less' : 'See more…'}
        </button>
      )}
    </div>
  )
}

export function PinnedNotes() {
  const notes = useAppStore((s) => s.notes)
  const pinned = useMemo(() => pinnedNotes(notes), [notes])
  if (pinned.length === 0) return null
  return (
    <Card
      accent="notes"
      title="Pinned"
      right={
        <span className="flex items-center gap-1">
          <Pin size={11} />
          {pinned.length}
        </span>
      }
    >
      <div className="flex flex-col gap-1.5">
        {pinned.map((n) => (
          <PinnedNote key={n.id} note={n} />
        ))}
      </div>
    </Card>
  )
}
