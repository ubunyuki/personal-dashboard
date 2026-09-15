import { useMemo, useState } from 'react'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clipboard, Tag } from 'lucide-react'
import { Drawer } from '../../components/ui/Drawer'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import { formatDueLabel } from '../../lib/dates/dates'
import { buildReview, reviewToMarkdown, weekRange } from './review'

const pillCls = (on: boolean) =>
  `flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
    on
      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
  }`

const navBtnCls =
  'rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800'

export function ReviewDrawer() {
  const close = useUiStore((s) => s.closeReview)
  const tasks = useAppStore((s) => s.tasks)
  const events = useAppStore((s) => s.events)
  const weekStartsOn = useAppStore((s) => s.settings.weekStartsOn)
  // Frozen at open: a ticking clock would shift the week out from under
  // someone mid-read. The drawer is short-lived, so reopening re-anchors it.
  const [now] = useState(() => new Date())

  const [offset, setOffset] = useState(0)
  const [groupBy, setGroupBy] = useState<'day' | 'project'>('day')
  const [includeEvents, setIncludeEvents] = useState(true)
  // Set when the clipboard is unavailable (or refused), so the markdown can
  // still be selected by hand.
  const [fallback, setFallback] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const week = useMemo(() => weekRange(now, offset, weekStartsOn), [now, offset, weekStartsOn])
  const data = useMemo(() => buildReview(tasks, events, week), [tasks, events, week])
  const markdown = useMemo(
    () => reviewToMarkdown(data, week, { groupBy, includeEvents }),
    [data, week, groupBy, includeEvents],
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setFallback(null)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setFallback(markdown)
    }
  }

  const groups =
    groupBy === 'day'
      ? data.byDay.map((g) => ({ key: g.day, heading: g.label, items: g.items }))
      : data.byProject.map((g) => ({
          key: g.project ?? '',
          heading: g.project ? `#${g.project}` : 'No project',
          items: g.items,
        }))

  return (
    <Drawer title="Weekly review" onClose={close} width="lg">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
        <button
          type="button"
          title="Previous week"
          className={navBtnCls}
          onClick={() => setOffset(offset - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium tabular-nums">{week.label}</span>
          {offset !== 0 && (
            <button
              type="button"
              className="text-[11px] text-indigo-600 hover:underline dark:text-indigo-400"
              onClick={() => setOffset(0)}
            >
              Back to this week
            </button>
          )}
        </div>
        <button
          type="button"
          title="Next week"
          className={navBtnCls}
          disabled={offset >= 0}
          onClick={() => setOffset(offset + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
        <button
          type="button"
          className={pillCls(groupBy === 'day')}
          onClick={() => setGroupBy('day')}
        >
          <CalendarDays size={13} /> By day
        </button>
        <button
          type="button"
          className={pillCls(groupBy === 'project')}
          onClick={() => setGroupBy('project')}
        >
          <Tag size={13} /> By project
        </button>
        <button
          type="button"
          className={pillCls(includeEvents)}
          onClick={() => setIncludeEvents(!includeEvents)}
        >
          Meetings
        </button>
        <button type="button" className={`${pillCls(false)} ml-auto`} onClick={copy}>
          {copied ? <Check size={13} /> : <Clipboard size={13} />}
          {copied ? 'Copied' : 'Copy markdown'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {data.taskCount === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            Nothing completed this week.
          </p>
        ) : (
          groups.map((g) => (
            <section key={g.key} className="mb-4">
              <h3 className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                {g.heading}
              </h3>
              <ul className="flex flex-col gap-1">
                {g.items.map((item) => (
                  <li key={item.id} className="flex items-baseline gap-2 text-sm">
                    <Check size={13} className="shrink-0 translate-y-0.5 text-emerald-500" />
                    <span className="flex-1">{item.title}</span>
                    {groupBy === 'day'
                      ? item.project && (
                          <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                            #{item.project}
                          </span>
                        )
                      : null}
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        {includeEvents && data.eventCount > 0 && (
          <section className="mb-4">
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              Meetings
            </h3>
            <ul className="flex flex-col gap-1">
              {data.events.map((e) => (
                <li key={e.id} className="flex items-baseline gap-2 text-sm">
                  <CalendarDays size={13} className="shrink-0 translate-y-0.5 text-amber-500" />
                  <span className="flex-1">{e.title}</span>
                  <span className="shrink-0 text-xs tabular-nums text-slate-400 dark:text-slate-500">
                    {formatDueLabel(e.date, e.time)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {fallback !== null && (
          <div className="mt-2">
            <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">
              Clipboard unavailable — select and copy:
            </p>
            <pre className="max-h-60 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-2 text-[11px] whitespace-pre-wrap dark:border-slate-700 dark:bg-slate-950">
              {fallback}
            </pre>
          </div>
        )}
      </div>

      <footer className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {data.taskCount} completed
        {includeEvents ? ` · ${data.eventCount} meetings` : ''}
      </footer>
    </Drawer>
  )
}
