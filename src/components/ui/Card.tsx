import type { ReactNode } from 'react'
import type { GroupColor } from '../../types'

export type CardAccent =
  | 'neutral'
  | 'tasks'
  | 'calendar'
  | 'notes'
  | 'bookmarks'
  | 'overdue'
  | 'dueToday'
  | GroupColor

/** Tailwind needs full literal class strings — never build these dynamically.
 *  Semantic accents map to the same hues as their plain-colour twins
 *  (tasks=indigo, notes=emerald, bookmarks=sky).
 *
 *  Urgency has its own three: overdue=red and dueToday=amber, with calendar
 *  on purple. Events used to be amber, which left nothing to distinguish "due
 *  today" from "an event exists" — the whole dashboard was indigo or amber and
 *  so nothing on it competed for the eye. Purple rather than violet because
 *  violet is already the bus feature's colour. */
const cardCls: Record<CardAccent, string> = {
  neutral: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
  tasks: 'border-indigo-200/70 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/30',
  calendar: 'border-purple-200/70 bg-purple-50/50 dark:border-purple-900/60 dark:bg-purple-950/30',
  notes: 'border-emerald-200/70 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/30',
  bookmarks: 'border-sky-200/70 bg-sky-50/50 dark:border-sky-900/60 dark:bg-sky-950/30',
  overdue: 'border-red-200/70 bg-red-50/50 dark:border-red-900/60 dark:bg-red-950/30',
  dueToday: 'border-amber-200/70 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/30',
  sky: 'border-sky-200/70 bg-sky-50/50 dark:border-sky-900/60 dark:bg-sky-950/30',
  indigo: 'border-indigo-200/70 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/30',
  emerald:
    'border-emerald-200/70 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/30',
  amber: 'border-amber-200/70 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/30',
  rose: 'border-rose-200/70 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/30',
  violet: 'border-violet-200/70 bg-violet-50/50 dark:border-violet-900/60 dark:bg-violet-950/30',
}

/** Exported so pages with custom card headers (bookmark groups) and in-card
 *  links can colour themselves to match the accent. */
export const cardTitleCls: Record<CardAccent, string> = {
  neutral: 'text-slate-500 dark:text-slate-400',
  tasks: 'text-indigo-700 dark:text-indigo-300',
  calendar: 'text-purple-700 dark:text-purple-300',
  notes: 'text-emerald-700 dark:text-emerald-300',
  bookmarks: 'text-sky-700 dark:text-sky-300',
  overdue: 'text-red-700 dark:text-red-300',
  dueToday: 'text-amber-700 dark:text-amber-300',
  sky: 'text-sky-700 dark:text-sky-300',
  indigo: 'text-indigo-700 dark:text-indigo-300',
  emerald: 'text-emerald-700 dark:text-emerald-300',
  amber: 'text-amber-700 dark:text-amber-300',
  rose: 'text-rose-700 dark:text-rose-300',
  violet: 'text-violet-700 dark:text-violet-300',
}

/** Hover ring for clickable cards. Follows the accent: a red "Overdue" tile
 *  that lit up indigo on hover would undo the colour it was given. */
const cardHoverCls: Record<CardAccent, string> = {
  neutral:
    'hover:border-indigo-300 hover:ring-2 hover:ring-indigo-200 dark:hover:border-indigo-700 dark:hover:ring-indigo-900',
  tasks:
    'hover:border-indigo-300 hover:ring-2 hover:ring-indigo-200 dark:hover:border-indigo-700 dark:hover:ring-indigo-900',
  calendar:
    'hover:border-purple-300 hover:ring-2 hover:ring-purple-200 dark:hover:border-purple-700 dark:hover:ring-purple-900',
  notes:
    'hover:border-emerald-300 hover:ring-2 hover:ring-emerald-200 dark:hover:border-emerald-700 dark:hover:ring-emerald-900',
  bookmarks:
    'hover:border-sky-300 hover:ring-2 hover:ring-sky-200 dark:hover:border-sky-700 dark:hover:ring-sky-900',
  overdue:
    'hover:border-red-300 hover:ring-2 hover:ring-red-200 dark:hover:border-red-700 dark:hover:ring-red-900',
  dueToday:
    'hover:border-amber-300 hover:ring-2 hover:ring-amber-200 dark:hover:border-amber-700 dark:hover:ring-amber-900',
  sky: 'hover:border-sky-300 hover:ring-2 hover:ring-sky-200 dark:hover:border-sky-700 dark:hover:ring-sky-900',
  indigo:
    'hover:border-indigo-300 hover:ring-2 hover:ring-indigo-200 dark:hover:border-indigo-700 dark:hover:ring-indigo-900',
  emerald:
    'hover:border-emerald-300 hover:ring-2 hover:ring-emerald-200 dark:hover:border-emerald-700 dark:hover:ring-emerald-900',
  amber:
    'hover:border-amber-300 hover:ring-2 hover:ring-amber-200 dark:hover:border-amber-700 dark:hover:ring-amber-900',
  rose: 'hover:border-rose-300 hover:ring-2 hover:ring-rose-200 dark:hover:border-rose-700 dark:hover:ring-rose-900',
  violet:
    'hover:border-violet-300 hover:ring-2 hover:ring-violet-200 dark:hover:border-violet-700 dark:hover:ring-violet-900',
}

/** Dashboard/section card. `accent` tints the surface and title to give each
 *  domain (tasks, calendar, notes, bookmarks) and each urgency level a
 *  recognizable hue.
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
      <button type="button" onClick={onClick} className={`${cls} text-left ${cardHoverCls[accent]}`}>
        {body}
      </button>
    )
  }
  return <section className={cls}>{body}</section>
}
