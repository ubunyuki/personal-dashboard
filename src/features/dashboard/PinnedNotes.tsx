import { useMemo } from 'react'
import { Pin } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { pinnedNotes } from '../notes/ordering'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

/**
 * Pinned notes, shown in full rather than as one-line summaries: the point of
 * pinning is to READ the note from the dashboard. Renders nothing at all when
 * nothing is pinned, so the tile costs the dashboard nothing until it is used.
 */
export function PinnedNotes() {
  const notes = useAppStore((s) => s.notes)
  const focusNote = useUiStore((s) => s.focusNote)
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
          <button
            key={n.id}
            type="button"
            onClick={() => focusNote(n.id)}
            title="Open in Notes"
            className="max-h-40 overflow-y-auto rounded-lg px-2 py-1.5 text-left text-sm whitespace-pre-wrap hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30"
          >
            {n.text}
          </button>
        ))}
      </div>
    </Card>
  )
}
