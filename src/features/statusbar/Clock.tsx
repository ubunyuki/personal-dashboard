import { CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import { useNow } from '../../lib/useNow'
import { useUiStore } from '../../store/uiStore'

/** Status-bar clock; clicking it (or its calendar icon) opens the calendar.
 *  The date part hides on narrow windows so the bar stays short before it scrolls. */
export function Clock() {
  const now = useNow(1_000)
  const toggleCalendar = useUiStore((s) => s.toggleCalendar)
  return (
    <button
      type="button"
      onClick={toggleCalendar}
      title="Calendar"
      aria-label="Open calendar"
      className="flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
    >
      <CalendarDays size={16} strokeWidth={1.75} />
      <time
        dateTime={now.toISOString()}
        className="text-sm whitespace-nowrap tabular-nums text-slate-600 dark:text-slate-300"
      >
        <span className="hidden md:inline">
          {format(now, 'EEE d MMM')}
          <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
        </span>
        {format(now, 'HH:mm')}
      </time>
    </button>
  )
}
