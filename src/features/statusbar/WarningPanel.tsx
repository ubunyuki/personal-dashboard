import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import { fetchWarningDetails } from '../../lib/weather/providers'
import { iconFor, labelFor } from '../../lib/weather/warnings'
import { useUiStore } from '../../store/uiStore'
import { useWarningStore } from '../../store/warningStore'

const HKO_WARNINGS = 'https://www.hko.gov.hk/en/wxinfo/currwx/warning.htm'

const hhmm = (iso: string | undefined) =>
  iso && !Number.isNaN(Date.parse(iso)) ? format(new Date(iso), 'HH:mm') : null

/** Warning detail. Rendered from App, not from the chip that opens it — the
 *  status bar scrolls horizontally and has a backdrop blur, either of which
 *  would clip it. Same reason CalendarPopover lives there. */
export function WarningPanel() {
  const close = useUiStore((s) => s.closeWarningPanel)
  const snapshot = useWarningStore((s) => s.snapshot)
  const error = useWarningStore((s) => s.error)
  const [details, setDetails] = useState<Record<string, string[]> | null>(null)

  // warningInfo is only worth a request while someone is looking at it.
  useEffect(() => {
    let alive = true
    fetchWarningDetails()
      .then((d) => alive && setDetails(d))
      .catch(() => alive && setDetails({}))
    return () => {
      alive = false
    }
  }, [])

  const warnings = snapshot?.warnings ?? []
  const tips = snapshot?.tips ?? []
  const fetched = hhmm(snapshot?.fetchedAt)

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={close} />
      <div className="fixed top-12 right-2 z-40 max-h-[70vh] w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        {tips.map((t) => (
          <div
            key={t.desc}
            className="mb-2 rounded-lg bg-amber-50 px-2.5 py-2 dark:bg-amber-950/60"
          >
            <p className="text-[10px] font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-400">
              Expected {hhmm(t.updateTime) ? `· issued ${hhmm(t.updateTime)}` : ''}
            </p>
            <p className="mt-0.5 text-sm text-amber-900 dark:text-amber-200">{t.desc}</p>
          </div>
        ))}

        {warnings.map((w) => {
          const src = iconFor(w)
          const lines = details?.[w.statement] ?? []
          return (
            <div key={w.statement} className="mb-2 last:mb-0">
              <div className="flex items-start gap-2 px-0.5">
                {src && <img src={src} alt="" className="mt-0.5 h-6 w-6 shrink-0 object-contain" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{labelFor(w)}</p>
                  {hhmm(w.issueTime) && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Issued {hhmm(w.issueTime)}
                    </p>
                  )}
                </div>
              </div>
              {lines.map((line) => (
                <p key={line} className="mt-1 px-0.5 text-xs text-slate-600 dark:text-slate-300">
                  {line}
                </p>
              ))}
            </div>
          )
        })}

        {warnings.length === 0 && tips.length === 0 && (
          <p className="px-2 py-3 text-sm text-slate-400 dark:text-slate-500">
            No warnings in force.
          </p>
        )}

        <div className="mt-1 flex items-center justify-between border-t border-slate-100 px-1 pt-1.5 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {error
              ? 'Last check failed — retrying'
              : fetched
                ? `Checked ${fetched}`
                : 'Checking…'}
          </span>
          <a
            href={HKO_WARNINGS}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1 text-[11px] text-indigo-600 hover:underline dark:text-indigo-400"
          >
            HKO
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </>
  )
}
