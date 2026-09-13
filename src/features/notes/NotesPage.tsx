import { useMemo } from 'react'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAppStore } from '../../store/appStore'
import { NoteCapture } from './NoteCapture'
import { NoteCard } from './NoteCard'

export function NotesPage() {
  const notes = useAppStore((s) => s.notes)
  const sorted = useMemo(
    () => [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notes],
  )
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4">
      <NoteCapture />
      {sorted.length === 0 ? (
        <EmptyState
          title="No notes yet"
          hint="Capture meeting points above — any note can become a full task later."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      )}
    </div>
  )
}
