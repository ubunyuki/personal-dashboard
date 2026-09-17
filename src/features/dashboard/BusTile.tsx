import { useMemo } from 'react'
import { format } from 'date-fns'
import { RefreshCw } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { sortBusStops } from '../../lib/bus/saved'
import { useNow } from '../../lib/useNow'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import { BusStopRow } from '../bus/BusStopRow'
import { useBusEtas } from '../bus/useBusEtas'
import { useBusNameBackfill } from '../bus/useBusNameBackfill'

/**
 * Live arrivals for the stops the user watches.
 *
 * Renders nothing at all until a stop has been saved — the tile is appended
 * to everyone's layout by reconcileLayout, and a permanent "add a bus stop"
 * prompt would be noise on the dashboard of everyone who does not take one.
 * The Bus tab is where stops are added; the tile appears once there is one.
 */
export function BusTile() {
  const busStops = useAppStore((s) => s.busStops)
  const setActiveTab = useUiStore((s) => s.setActiveTab)
  const stops = useMemo(() => sortBusStops(busStops), [busStops])
  const now = useNow(30_000)
  const feed = useBusEtas(stops)
  useBusNameBackfill(stops, feed)
  if (stops.length === 0) return null
  return (
    <Card
      accent="violet"
      title="Bus arrivals"
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
      <div className="flex flex-col">
        {stops.map((s) => (
          <BusStopRow key={s.id} stop={s} result={feed.byStop[s.id]} now={now} />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setActiveTab('bus')}
        className="mt-1 rounded px-1 text-[11px] text-violet-700 hover:underline dark:text-violet-300"
      >
        Manage stops →
      </button>
    </Card>
  )
}
