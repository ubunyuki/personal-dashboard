import type { ReactNode } from 'react'

export const inputCls =
  'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-950'

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  /** Format guidance shown under the control — e.g. how a time may be typed. */
  hint?: ReactNode
  children: ReactNode
}) {
  // The hint sits outside the <label> on purpose: inside, it joins the
  // control's accessible name ("Due time 24-hour — e.g. 1430…") instead of
  // reading as the aside it is.
  return (
    <div className="block">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {children}
      </label>
      {hint && (
        <span className="mt-1 block text-[11px] text-slate-400 dark:text-slate-500">{hint}</span>
      )}
    </div>
  )
}
