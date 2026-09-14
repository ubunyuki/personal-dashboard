import { useMemo } from 'react'
import { addDays, format } from 'date-fns'
import { Card } from '../../components/ui/Card'
import { parseLocalDate, toLocalDate } from '../../lib/dates/dates'
import { useNow } from '../../lib/useNow'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

export function UpcomingEvents() {
  const events = useAppStore((s) => s.events)
  const openCalendar = useUiStore((s) => s.openCalendar)
  const now = useNow(60_000)
  const today = toLocalDate(now)
  const tomorrow = toLocalDate(addDays(now, 1))
  const end = toLocalDate(addDays(now, 7))

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => e.date >= today && e.date <= end)
        .sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? ''))),
    [events, today, end],
  )

  const dayLabel = (d: string) =>
    d === today ? 'Today' : d === tomorrow ? 'Tomorrow' : format(parseLocalDate(d), 'EEE d MMM')

  return (
    <Card accent="calendar" title="Upcoming events" right={upcoming.length}>
      {upcoming.length === 0 ? (
        <p className="py-2 text-sm text-slate-400 dark:text-slate-500">
          No events in the next 7 days — add one from the calendar.
        </p>
      ) : (
        <div className="flex flex-col">
          {upcoming.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => openCalendar(e.date)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-amber-100/60 dark:hover:bg-amber-900/30"
            >
              <span className="w-20 shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
                {dayLabel(e.date)}
              </span>
              <span className="w-12 shrink-0 text-xs tabular-nums text-amber-600 dark:text-amber-400">
                {e.time ?? ''}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{e.title}</span>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}
