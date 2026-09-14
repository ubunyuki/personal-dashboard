import type { GroupColor } from '../../types'

/** Tailwind needs full literal class strings — never build these dynamically. */

/** Solid swatch dots for colour pickers (bookmark groups, projects). */
export const swatchCls: Record<GroupColor, string> = {
  sky: 'bg-sky-400',
  indigo: 'bg-indigo-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  violet: 'bg-violet-400',
}

/** Tinted pill per colour (project filter chips, task #tags). */
export const tintChipCls: Record<GroupColor, string> = {
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
}

/** Icon button whose hover overlay stays neutral so it reads on every card tint. */
export const tintedIconBtnCls =
  'rounded p-1 text-slate-400 hover:bg-black/5 hover:text-slate-600 disabled:pointer-events-none disabled:opacity-30 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-300'
