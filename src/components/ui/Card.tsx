import type { ReactNode } from 'react'

export type CardAccent = 'neutral' | 'tasks' | 'calendar' | 'notes' | 'bookmarks'

/** Tailwind needs full literal class strings — never build these dynamically. */
const cardCls: Record<CardAccent, string> = {
  neutral: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
  tasks: 'border-indigo-200/70 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/30',
  calendar: 'border-amber-200/70 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/30',
  notes: 'border-emerald-200/70 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/30',
  bookmarks: 'border-sky-200/70 bg-sky-50/50 dark:border-sky-900/60 dark:bg-sky-950/30',
}

const titleCls: Record<CardAccent, string> = {
  neutral: 'text-slate-500 dark:text-slate-400',
  tasks: 'text-indigo-700 dark:text-indigo-300',
  calendar: 'text-amber-700 dark:text-amber-300',
  notes: 'text-emerald-700 dark:text-emerald-300',
  bookmarks: 'text-sky-700 dark:text-sky-300',
}

/** Dashboard/section card. `accent` tints the surface and title to give each
 *  domain (tasks, calendar, notes, bookmarks) a recognizable hue. */
export function Card({
  accent = 'neutral',
  title,
  right,
  className = '',
  children,
}: {
  accent?: CardAccent
  title?: string
  right?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={`rounded-xl border p-3 ${cardCls[accent]} ${className}`}>
      {title !== undefined && (
        <header className="mb-1 flex items-baseline justify-between">
          <h3 className={`text-xs font-semibold tracking-wide uppercase ${titleCls[accent]}`}>
            {title}
          </h3>
          {right !== undefined && (
            <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500">{right}</span>
          )}
        </header>
      )}
      {children}
    </section>
  )
}
