import { useMemo } from 'react'
import { format } from 'date-fns'
import { RefreshCw } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { sortBusStops } from '../../lib/bus/saved'
import { useNow } from '../../lib/useNow'
import { useAppStore } from '../../store/appStore'
import { BusStopPicker } from './BusStopPicker'
import { BusStopRow } from './BusStopRow'
import { useBusEtas } from './useBusEtas'
import { useBusNameBackfill } from './useBusNameBackfill'

/**
 * The Bus tab: the watched stops with their controls, and the picker for
 * adding more or checking a route ad hoc.
 *
 * The page and the dashboard tile both poll, but they can never be mounted at
 * the same time — App renders exactly one tab — so there is no risk of two
 * timers asking for the same arrivals.
 */
export function BusPage() {
  const busStops = useAppStore((s) => s.busStops)
  const stops = useMemo(() => sortBusStops(busStops), [busStops])
  const now = useNow(30_000)
  const feed = useBusEtas(stops)
  useBusNameBackfill(stops, feed)
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4">
      <div className="grid items-start gap-3 md:grid-cols-2">
        <Card
          accent="violet"
          title="Your stops"
          right={
            <span className="flex items-center gap-1.5">
              {feed.error ? (
                <span className="text-amber-600 dark:text-amber-400">offline</span>
              ) : (
                feed.fetchedAt !== null && <span>{format(feed.fetchedAt, 'HH:mm')}</span>
              )}
              <button
                type="button"
                title="Refresh now"
                onClick={feed.refresh}
                className="rounded p-0.5 hover:bg-black/5 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-300"
              >
                <RefreshCw size={12} className={feed.loading ? 'animate-spin' : undefined} />
              </button>
            </span>
          }
        >
          {stops.length === 0 ? (
            <p className="py-2 text-sm text-slate-400 dark:text-slate-500">
              No stops yet — find a route below and add one. Saved stops also appear on the
              dashboard.
            </p>
          ) : (
            <div className="flex flex-col">
              {stops.map((s, i) => (
                <BusStopRow
                  key={s.id}
                  stop={s}
                  result={feed.byStop[s.id]}
                  now={now}
                  editable
                  first={i === 0}
                  last={i === stops.length - 1}
                />
              ))}
            </div>
          )}
        </Card>
        <BusStopPicker />
      </div>
      <p className="px-1 text-[11px] text-slate-400 dark:text-slate-500">
        Arrival times are the operators’ own estimates, from KMB and Citybus open data on
        data.gov.hk. Times refresh every minute while this tab is open.
      </p>
    </div>
  )
}
