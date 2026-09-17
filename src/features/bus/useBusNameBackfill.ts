import { useEffect } from 'react'
import { loadStopInfo } from '../../lib/bus/api'
import { useAppStore } from '../../store/appStore'
import type { SavedBusStop } from '../../types'
import type { BusFeed } from './useBusEtas'

/**
 * Gives stops saved before schema v6 their Chinese names.
 *
 * Names are copied into the saved stop rather than looked up on render (see
 * SavedBusStop), which is what lets the tile draw offline — and also what
 * stops a language switch from retranslating anything already saved. So the
 * names have to arrive some other way:
 *
 * - The destination is free. Every arrival row carries `dest_tc`, so the poll
 *   that fills the tile has already fetched it.
 * - The stop name is one request per stop that lacks one, cached for a day by
 *   loadStopInfo and then never asked again, because the answer is written
 *   into the stop.
 *
 * Both write through setBusStopNames, which ignores a name it already has, so
 * calling this from every surface that lists stops is harmless.
 */
export function useBusNameBackfill(stops: SavedBusStop[], feed: BusFeed): void {
  const setBusStopNames = useAppStore((s) => s.setBusStopNames)
  const byStop = feed.byStop

  useEffect(() => {
    for (const s of stops) {
      if (s.destinationTc) continue
      const destinationTc = byStop[s.id]?.etas.find((e) => e.destinationTc)?.destinationTc
      if (destinationTc) setBusStopNames(s.id, { destinationTc })
    }
  }, [stops, byStop, setBusStopNames])

  useEffect(() => {
    const missing = stops.filter((s) => !s.stopNameTc)
    if (missing.length === 0) return
    let alive = true
    void (async () => {
      // All at once, then one pass of writes: patching inside the loop would
      // hand this effect a new `stops` array mid-flight and restart it.
      const found = await Promise.all(
        missing.map(
          async (s) => [s.id, await loadStopInfo(s.operator, s.stopId).catch(() => null)] as const,
        ),
      )
      if (!alive) return
      for (const [id, info] of found) {
        if (info?.nameTc) setBusStopNames(id, { stopNameTc: info.nameTc })
      }
    })()
    return () => {
      alive = false
    }
  }, [stops, setBusStopNames])
}
