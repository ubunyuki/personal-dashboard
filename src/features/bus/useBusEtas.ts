import { useEffect, useRef, useState } from 'react'
import { fetchEtas } from '../../lib/bus/api'
import type { BusEtaResult } from '../../lib/bus/eta'
import { busStopKey } from '../../lib/bus/saved'
import type { SavedBusStop } from '../../types'

/** Everything the ETA endpoint needs. A saved stop satisfies it, and so does
 *  the picker's throwaway preview of a stop that has not been saved. */
export type BusWatch = Pick<
  SavedBusStop,
  'id' | 'operator' | 'route' | 'direction' | 'serviceType' | 'stopId'
>

export interface BusFeed {
  /** Keyed by watch id. A stop missing from here has never answered yet. */
  byStop: Record<string, BusEtaResult>
  /** When the last successful round finished; null before the first one. */
  fetchedAt: Date | null
  loading: boolean
  /** At least one stop failed on the last round. */
  error: boolean
  refresh: () => void
}

/** KMB refreshes its own ETAs about this often, so polling faster would only
 *  re-read the same numbers. */
const POLL_MS = 60_000
/** Floor between a visibility-triggered refetch and the last attempt, so
 *  alt-tabbing cannot turn into a burst of requests. */
const MIN_GAP_MS = 15_000

/**
 * Live arrivals for a list of watched stops.
 *
 * Unlike the HKO warning poll, which deliberately keeps running while the tab
 * is hidden, this one goes quiet: nobody reads a bus time they cannot see,
 * and the numbers are meaningless a minute later anyway. The timer keeps
 * ticking while hidden but makes no request, and becoming visible refetches
 * immediately so the tile is never showing a stale minute count.
 */
export function useBusEtas(stops: BusWatch[]): BusFeed {
  const [byStop, setByStop] = useState<Record<string, BusEtaResult>>({})
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [manual, setManual] = useState(0)

  // Read the list through a ref so the poll is rebuilt only when the WATCH
  // LIST itself changes — `stops` is a fresh array on every render, and
  // depending on it directly would tear the timer down continuously.
  const stopsRef = useRef(stops)
  useEffect(() => {
    stopsRef.current = stops
  }, [stops])

  const watchKey = stops.map((s) => `${s.id}@${busStopKey(s)}`).join('|')

  useEffect(() => {
    // Nothing watched: no timer, and no state to clear — the feed returned
    // below reports empty without the effect having to reset anything.
    if (watchKey === '') return
    let alive = true
    let timer = 0
    let lastAttempt = 0

    // Declarations, not consts: arm → tick → poll → arm is a cycle, and
    // hoisting is what lets it be written in reading order.
    function arm() {
      window.clearTimeout(timer)
      timer = window.setTimeout(tick, POLL_MS)
    }

    function tick() {
      // Hidden: skip the request but keep the timer, so there is always one
      // pending and the poll cannot strand itself between visibility events.
      if (document.visibilityState === 'visible') void poll()
      else arm()
    }

    async function poll() {
      lastAttempt = Date.now()
      setLoading(true)
      const now = new Date()
      const results = await Promise.all(
        stopsRef.current.map(
          async (s) =>
            [
              s.id,
              await fetchEtas(
                {
                  operator: s.operator,
                  route: s.route,
                  direction: s.direction,
                  serviceType: s.serviceType,
                  stopId: s.stopId,
                },
                now,
              ).catch(() => null),
            ] as const,
        ),
      )
      if (!alive) return
      setLoading(false)
      setError(results.some(([, r]) => r === null))
      if (results.some(([, r]) => r !== null)) setFetchedAt(now)
      // A stop that failed keeps whatever it last showed, alongside the
      // error flag — a momentary blip should not blank the tile.
      setByStop((prev) => {
        const next: Record<string, BusEtaResult> = {}
        for (const [id, res] of results) {
          const kept = res ?? prev[id]
          if (kept) next[id] = kept
        }
        return next
      })
      if (alive) arm()
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastAttempt > MIN_GAP_MS) {
        void poll()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    void poll()

    return () => {
      alive = false
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [watchKey, manual])

  const refresh = () => setManual((n) => n + 1)
  if (watchKey === '') return { byStop: {}, fetchedAt: null, loading: false, error: false, refresh }
  return { byStop, fetchedAt, loading, error, refresh }
}
