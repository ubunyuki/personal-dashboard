import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { Card } from '../../components/ui/Card'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

export function RecentNotes() {
  const notes = useAppStore((s) => s.notes)
  const setActiveTab = useUiStore((s) => s.setActiveTab)
  const recent = useMemo(
    () => [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5),
    [notes],
  )
  return (
    <Card accent="notes" title="Recent notes" right={notes.length}>
      {recent.length === 0 ? (
        <p className="py-2 text-sm text-slate-400 dark:text-slate-500">
          Nothing captured yet — use the pen button up top.
        </p>
      ) : (
        <div className="flex flex-col">
          {recent.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setActiveTab('notes')}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30"
            >
              <span className="min-w-0 flex-1 truncate text-sm">{n.text.split('\n')[0]}</span>
              <span className="shrink-0 text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                {format(parseISO(n.updatedAt), 'd MMM HH:mm')}
              </span>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}
