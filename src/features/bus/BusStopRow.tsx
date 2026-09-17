import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Pencil, Trash2, X } from 'lucide-react'
import { inputCls } from '../../components/ui/Field'
import { tintedIconBtnCls as iconBtn } from '../../components/ui/swatches'
import { etaSummary, formatEta, isFeedStale, minutesUntil, type BusEtaResult } from '../../lib/bus/eta'
import { busStopDestination, busStopName, busStopTitle } from '../../lib/bus/saved'
import { useAppStore } from '../../store/appStore'
import type { SavedBusStop } from '../../types'
import { operatorChipCls, operatorName } from './operator'

/**
 * The arrival times themselves — shared by the saved-stop row and the
 * picker's live preview.
 *
 * Minutes are recomputed from the ISO instant on every tick of `now` rather
 * than read off the parsed row: the poll is 60s, so a value that was right
 * when it arrived is a minute wrong by the time it is replaced.
 */
export function BusArrivals({ result, now }: { result: BusEtaResult | undefined; now: Date }) {
  if (!result) {
    return <span className="text-xs text-slate-400 dark:text-slate-500">Loading…</span>
  }
  const summary = etaSummary(result)
  if (summary !== null) {
    return <span className="text-xs text-slate-400 dark:text-slate-500">{summary}</span>
  }
  const stale = isFeedStale(result.feedAt, now)
  const times = result.etas.slice(0, 3)
  return (
    <div className="flex shrink-0 items-baseline gap-2">
      {times.map((e, i) => (
        <span
          key={`${e.at ?? 'none'}-${i}`}
          title={e.remark}
          className={
            i === 0
              ? `text-sm font-semibold tabular-nums ${stale ? 'text-slate-400 dark:text-slate-500' : 'text-violet-700 dark:text-violet-300'}`
              : 'text-xs tabular-nums text-slate-400 dark:text-slate-500'
          }
        >
          {formatEta(e.at === null ? null : minutesUntil(e.at, now))}
        </span>
      ))}
      {stale && (
        <span className="text-[11px] text-amber-600 dark:text-amber-400" title="The operator's feed has not updated recently">
          stale
        </span>
      )}
    </div>
  )
}

/**
 * One watched stop. `editable` is what the Bus page turns on — the dashboard
 * tile is read-only, so the same row can be dropped into either without the
 * tile growing a set of controls nobody wants there.
 */
export function BusStopRow({
  stop,
  result,
  now,
  editable = false,
  first = false,
  last = false,
}: {
  stop: SavedBusStop
  result: BusEtaResult | undefined
  now: Date
  editable?: boolean
  first?: boolean
  last?: boolean
}) {
  const moveBusStop = useAppStore((s) => s.moveBusStop)
  const removeBusStop = useAppStore((s) => s.removeBusStop)
  const setBusStopLabel = useAppStore((s) => s.setBusStopLabel)
  const lang = useAppStore((s) => s.settings.busStopLanguage ?? 'tc')
  const [draft, setDraft] = useState<string | null>(null)

  const commit = () => {
    if (draft !== null) setBusStopLabel(stop.id, draft)
    setDraft(null)
  }

  return (
    <div className="flex items-center gap-2 rounded-lg px-1 py-1">
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums ${operatorChipCls[stop.operator]}`}
        title={operatorName[stop.operator]}
      >
        {stop.route}
      </span>
      <div className="min-w-0 flex-1">
        {draft === null ? (
          <p className="truncate text-sm">{busStopTitle(stop, lang)}</p>
        ) : (
          <input
            autoFocus
            className={`${inputCls} py-0.5 text-sm`}
            aria-label="Stop name"
            value={draft}
            placeholder={busStopName(stop, lang)}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') setDraft(null)
            }}
          />
        )}
        <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
          to {busStopDestination(stop, lang)}
          {stop.label !== undefined && ` · ${busStopName(stop, lang)}`}
        </p>
      </div>
      <BusArrivals result={result} now={now} />
      {editable && (
        <div className="flex shrink-0 items-center gap-0.5">
          {draft === null ? (
            <>
              <button
                type="button"
                title="Move stop up"
                className={iconBtn}
                disabled={first}
                onClick={() => moveBusStop(stop.id, -1)}
              >
                <ChevronUp size={13} />
              </button>
              <button
                type="button"
                title="Move stop down"
                className={iconBtn}
                disabled={last}
                onClick={() => moveBusStop(stop.id, 1)}
              >
                <ChevronDown size={13} />
              </button>
              <button
                type="button"
                title="Rename stop"
                className={iconBtn}
                onClick={() => setDraft(stop.label ?? '')}
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                title="Remove stop"
                className={iconBtn}
                onClick={() => removeBusStop(stop.id)}
              >
                <Trash2 size={13} />
              </button>
            </>
          ) : (
            <>
              {/* onMouseDown, not onClick: the input's onBlur fires first and
                  would unmount these buttons before a click could land. */}
              <button type="button" title="Save name" className={iconBtn} onMouseDown={commit}>
                <Check size={13} />
              </button>
              <button
                type="button"
                title="Cancel"
                className={iconBtn}
                onMouseDown={() => setDraft(null)}
              >
                <X size={13} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
