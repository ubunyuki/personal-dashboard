import { format } from 'date-fns'
import { CloudAlert, X } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { useWarningStore } from '../../store/warningStore'

/**
 * The in-app notification for a warning change. Sticks until dismissed rather
 * than fading: a signal change happens a handful of times a year and is worth
 * an explicit acknowledgement — and the user may be away from the screen for
 * longer than any sensible auto-dismiss.
 */
export function WarningToast() {
  const alert = useWarningStore((s) => s.alert)
  const dismiss = useWarningStore((s) => s.dismissAlert)
  const toggleWarningPanel = useUiStore((s) => s.toggleWarningPanel)
  if (!alert) return null

  const at = Number.isNaN(Date.parse(alert.at)) ? null : format(new Date(alert.at), 'HH:mm')

  return (
    <div
      role="alert"
      className="fixed right-3 bottom-3 z-50 flex w-80 max-w-[calc(100vw-1.5rem)] items-start gap-2.5 rounded-xl border border-red-200 bg-white p-3 shadow-xl dark:border-red-900 dark:bg-slate-900"
    >
      <CloudAlert size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{alert.title}</p>
        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{alert.body}</p>
        <button
          type="button"
          onClick={() => {
            dismiss()
            toggleWarningPanel()
          }}
          className="mt-1.5 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Details{at ? ` · ${at}` : ''}
        </button>
      </div>
      <button
        type="button"
        onClick={dismiss}
        title="Dismiss"
        className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
      >
        <X size={14} />
      </button>
    </div>
  )
}
