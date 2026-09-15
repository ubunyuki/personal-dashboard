import type { ReactNode } from 'react'
import type { GroupColor } from '../../types'

export type CardAccent = 'neutral' | 'tasks' | 'calendar' | 'notes' | 'bookmarks' | GroupColor

/** Tailwind needs full literal class strings — never build these dynamically.
 *  Semantic accents map to the same hues as their plain-colour twins
 *  (tasks=indigo, calendar=amber, notes=emerald, bookmarks=sky). */
const cardCls: Record<CardAccent, string> = {
  neutral: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
  tasks: 'border-indigo-200/70 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/30',
  calendar: 'border-amber-200/70 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/30',
  notes: 'border-emerald-200/70 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/30',
  bookmarks: 'border-sky-200/70 bg-sky-50/50 dark:border-sky-900/60 dark:bg-sky-950/30',
  sky: 'border-sky-200/70 bg-sky-50/50 dark:border-sky-900/60 dark:bg-sky-950/30',
  indigo: 'border-indigo-200/70 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/30',
  emerald:
    'border-emerald-200/70 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/30',
  amber: 'border-amber-200/70 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/30',
  rose: 'border-rose-200/70 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/30',
  violet: 'border-violet-200/70 bg-violet-50/50 dark:border-violet-900/60 dark:bg-violet-950/30',
}

/** Exported so pages with custom card headers (bookmark groups) can colour
 *  their titles to match the accent. */
export const cardTitleCls: Record<CardAccent, string> = {
  neutral: 'text-slate-500 dark:text-slate-400',
  tasks: 'text-indigo-700 dark:text-indigo-300',
  calendar: 'text-amber-700 dark:text-amber-300',
  notes: 'text-emerald-700 dark:text-emerald-300',
  bookmarks: 'text-sky-700 dark:text-sky-300',
  sky: 'text-sky-700 dark:text-sky-300',
  indigo: 'text-indigo-700 dark:text-indigo-300',
  emerald: 'text-emerald-700 dark:text-emerald-300',
  amber: 'text-amber-700 dark:text-amber-300',
  rose: 'text-rose-700 dark:text-rose-300',
  violet: 'text-violet-700 dark:text-violet-300',
}

/** Dashboard/section card. `accent` tints the surface and title to give each
 *  domain (tasks, calendar, notes, bookmarks) a recognizable hue.
 *  With `onClick` the whole card becomes a button, so its children must then
 *  be phrasing content — spans, not <p> or <h3>. */
export function Card({
  accent = 'neutral',
  title,
  right,
  className = '',
  onClick,
  children,
}: {
  accent?: CardAccent
  title?: string
  right?: ReactNode
  className?: string
  onClick?: () => void
  children: ReactNode
}) {
  const cls = `rounded-xl border p-3 ${cardCls[accent]} ${className}`
  const body = (
    <>
      {title !== undefined && (
        <header className="mb-1 flex items-baseline justify-between">
          <h3 className={`text-xs font-semibold tracking-wide uppercase ${cardTitleCls[accent]}`}>
            {title}
          </h3>
          {right !== undefined && (
            <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500">{right}</span>
          )}
        </header>
      )}
      {children}
    </>
  )
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${cls} text-left hover:border-indigo-300 hover:ring-2 hover:ring-indigo-200 dark:hover:border-indigo-700 dark:hover:ring-indigo-900`}
      >
        {body}
      </button>
    )
  }
  return <section className={cls}>{body}</section>
}
