import { useMemo, type ReactNode } from 'react'
import type { CalEvent, Task } from '../../types'
import { useNow } from '../../lib/useNow'
import { formatDueLabel } from '../../lib/dates/dates'
import { deriveReminders } from '../../lib/dates/reminders'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-1 last:mb-0">
      <p className="px-2 pt-1 pb-0.5 text-[10px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
        {label}
      </p>
      {children}
    </div>
  )
}

/** The reminders dropdown. Rendered from App, not from the bell that opens it:
 *  the status bar is a horizontal scroll container with a backdrop blur, and
 *  either of those would clip it. Same reason CalendarPopover lives there. */
export function RemindersPanel() {
  const closeBell = useUiStore((s) => s.closeBell)
  const openTaskEditor = useUiStore((s) => s.openTaskEditor)
  const openCalendar = useUiStore((s) => s.openCalendar)
  const tasks = useAppStore((s) => s.tasks)
  const events = useAppStore((s) => s.events)
  const now = useNow()
  const r = useMemo(() => deriveReminders(tasks, events, now), [tasks, events, now])

  const pickTask = (t: Task) => {
    closeBell()
    openTaskEditor(t.id)
  }
  const pickEvent = (e: CalEvent) => {
    openCalendar(e.date)
  }

  const taskRow = (t: Task, dueCls: string) => (
    <button
      key={t.id}
      type="button"
      onClick={() => pickTask(t)}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
    >
      <span className="min-w-0 flex-1 truncate">{t.title}</span>
      {t.dueDate && (
        <span className={`shrink-0 text-xs tabular-nums ${dueCls}`}>
          {formatDueLabel(t.dueDate, t.dueTime)}
        </span>
      )}
    </button>
  )

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={closeBell} />
      <div className="fixed top-12 right-2 z-40 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        {r.count === 0 ? (
          <p className="px-2 py-3 text-sm text-slate-400 dark:text-slate-500">
            All clear — nothing due right now.
          </p>
        ) : (
          <>
            {r.overdue.length > 0 && (
              <Section label="Overdue">
                {r.overdue.map((t) => taskRow(t, 'font-medium text-red-600 dark:text-red-400'))}
              </Section>
            )}
            {r.dueSoon.length > 0 && (
              <Section label="Due soon">
                {r.dueSoon.map((t) => taskRow(t, 'text-slate-400 dark:text-slate-500'))}
              </Section>
            )}
            {r.todayEvents.length > 0 && (
              <Section label="Today's events">
                {r.todayEvents.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => pickEvent(e)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="w-12 shrink-0 text-xs tabular-nums text-amber-600 dark:text-amber-400">
                      {e.time ?? 'all day'}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{e.title}</span>
                  </button>
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </>
  )
}
