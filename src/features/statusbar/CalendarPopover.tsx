import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { TaskPriority } from '../../types'
import { inputCls } from '../../components/ui/Field'
import { buildMonthGrid, parseLocalDate, toLocalDate } from '../../lib/dates/dates'
import { useNow } from '../../lib/useNow'
import { useAppStore } from '../../store/appStore'
import { compareDue } from '../../store/selectors'
import { useUiStore } from '../../store/uiStore'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const prioDot: Record<TaskPriority, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-slate-400',
}

export function CalendarPopover() {
  const cal = useUiStore((s) => s.calendar)
  if (!cal.open) return null
  return <CalendarPanel key={cal.date ?? 'plain'} initialDate={cal.date} />
}

function CalendarPanel({ initialDate }: { initialDate: string | null }) {
  const closeCalendar = useUiStore((s) => s.closeCalendar)
  const openTaskEditor = useUiStore((s) => s.openTaskEditor)
  const tasks = useAppStore((s) => s.tasks)
  const events = useAppStore((s) => s.events)
  const addEvent = useAppStore((s) => s.addEvent)
  const deleteEvent = useAppStore((s) => s.deleteEvent)
  const now = useNow(60_000)
  const todayStr = toLocalDate(now)

  const [selected, setSelected] = useState(initialDate ?? todayStr)
  const [view, setView] = useState(() => {
    const d = parseLocalDate(initialDate ?? todayStr)
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCalendar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeCalendar])

  const grid = useMemo(() => buildMonthGrid(view.year, view.month), [view])
  const markers = useMemo(() => {
    const m = new Map<string, { tasks: number; events: number }>()
    for (const t of tasks) {
      if (!t.dueDate || t.status === 'done') continue
      const entry = m.get(t.dueDate) ?? { tasks: 0, events: 0 }
      entry.tasks++
      m.set(t.dueDate, entry)
    }
    for (const e of events) {
      const entry = m.get(e.date) ?? { tasks: 0, events: 0 }
      entry.events++
      m.set(e.date, entry)
    }
    return m
  }, [tasks, events])

  const dayTasks = useMemo(
    () => tasks.filter((t) => t.dueDate === selected && t.status !== 'done').sort(compareDue),
    [tasks, selected],
  )
  const dayEvents = useMemo(
    () =>
      events
        .filter((e) => e.date === selected)
        .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')),
    [events, selected],
  )

  const shiftMonth = (delta: number) =>
    setView((v) => {
      const m = v.month + delta
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 }
    })

  const goToday = () => {
    setView({ year: now.getFullYear(), month: now.getMonth() })
    setSelected(todayStr)
  }

  const add = () => {
    const t = title.trim()
    if (!t) return
    addEvent({ title: t, date: selected, time: time || undefined })
    setTitle('')
    setTime('')
  }

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={closeCalendar} />
      <div className="fixed top-12 right-2 z-40 w-[22rem] rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <header className="mb-2 flex items-center gap-1">
          <button type="button" title="Previous month" onClick={() => shiftMonth(-1)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            <ChevronLeft size={16} />
          </button>
          <span className="flex-1 text-center text-sm font-semibold">
            {format(new Date(view.year, view.month, 1), 'MMMM yyyy')}
          </span>
          <button type="button" title="Next month" onClick={() => shiftMonth(1)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            <ChevronRight size={16} />
          </button>
          <button type="button" onClick={goToday} className="ml-1 rounded-md px-2 py-0.5 text-xs text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950">
            Today
          </button>
        </header>
        <div className="grid grid-cols-7 gap-0.5">
          {WEEKDAYS.map((d) => (
            <span key={d} className="pb-1 text-center text-[10px] font-medium text-slate-400 dark:text-slate-500">
              {d}
            </span>
          ))}
          {grid.map((cell) => {
            const sel = cell.date === selected
            const mk = markers.get(cell.date)
            return (
              <button
                key={cell.date}
                type="button"
                aria-label={cell.date}
                onClick={() => setSelected(cell.date)}
                className={`flex h-9 flex-col items-center justify-center rounded-md text-xs tabular-nums ${
                  sel
                    ? 'bg-indigo-600 font-semibold text-white'
                    : cell.date === todayStr
                      ? 'font-bold text-indigo-600 ring-1 ring-indigo-300 hover:bg-slate-100 dark:text-indigo-400 dark:ring-indigo-700 dark:hover:bg-slate-800'
                      : cell.inMonth
                        ? 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                        : 'text-slate-300 hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-slate-800/50'
                }`}
              >
                <span>{cell.day}</span>
                <span className="flex h-1 items-center gap-0.5">
                  {(mk?.tasks ?? 0) > 0 && (
                    <span className={`h-1 w-1 rounded-full ${sel ? 'bg-white' : 'bg-indigo-500'}`} />
                  )}
                  {(mk?.events ?? 0) > 0 && (
                    <span className={`h-1 w-1 rounded-full ${sel ? 'bg-amber-200' : 'bg-amber-500'}`} />
                  )}
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-800">
          <p className="mb-1 px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {format(parseLocalDate(selected), 'EEEE d MMMM')}
          </p>
          {dayTasks.length === 0 && dayEvents.length === 0 && (
            <p className="px-1 py-1 text-sm text-slate-400 dark:text-slate-500">Nothing on this day.</p>
          )}
          {dayTasks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                closeCalendar()
                openTaskEditor(t.id)
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${prioDot[t.priority]}`} />
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              {t.dueTime && <span className="shrink-0 text-xs tabular-nums text-slate-400">{t.dueTime}</span>}
            </button>
          ))}
          {dayEvents.map((e) => (
            <div key={e.id} className="group flex items-center gap-2 rounded-md px-2 py-1 text-sm">
              <span className="w-12 shrink-0 text-xs tabular-nums text-amber-600 dark:text-amber-400">
                {e.time ?? 'all day'}
              </span>
              <span className="min-w-0 flex-1 truncate">{e.title}</span>
              <button
                type="button"
                title="Delete event"
                onClick={() => deleteEvent(e.id)}
                className="rounded p-0.5 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <form
            className="mt-1.5 flex items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault()
              add()
            }}
          >
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add event…"
            />
            <input
              type="time"
              className="w-24 shrink-0 rounded-md border border-slate-300 bg-white px-1.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <button
              type="submit"
              disabled={!title.trim()}
              className="shrink-0 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
