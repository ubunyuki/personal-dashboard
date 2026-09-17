import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, Plus, Search } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { inputCls } from '../../components/ui/Field'
import { loadRouteStops, loadRoutes } from '../../lib/bus/api'
import {
  searchRoutes,
  stopInfoName,
  variantDestination,
  variantKey,
  variantOrigin,
  type BusRouteVariant,
  type BusStopInfo,
} from '../../lib/bus/eta'
import { busStopKey } from '../../lib/bus/saved'
import { useNow } from '../../lib/useNow'
import { useAppStore } from '../../store/appStore'
import type { BusOperator } from '../../types'
import { BusArrivals } from './BusStopRow'
import { operatorChipCls, operatorName } from './operator'
import { useBusEtas } from './useBusEtas'

const OPERATORS: BusOperator[] = ['KMB', 'CTB']

const rowCls =
  'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-violet-100/60 dark:hover:bg-violet-900/30'

/**
 * Route → direction → stop, then add it to the dashboard.
 *
 * The route lists are the only large downloads in the feature (~350 KB for
 * KMB), so they are fetched once per operator per day through the IndexedDB
 * cache in lib/bus/cache.ts and never touch the store or a backup.
 *
 * Selecting a stop shows its live arrivals immediately, which doubles as the
 * ad-hoc lookup: check when the next bus goes without saving anything.
 */
export function BusStopPicker() {
  const saved = useAppStore((s) => s.busStops)
  const addBusStop = useAppStore((s) => s.addBusStop)
  const lang = useAppStore((s) => s.settings.busStopLanguage ?? 'tc')

  const [operator, setOperator] = useState<BusOperator>('KMB')
  const [query, setQuery] = useState('')
  const [variant, setVariant] = useState<BusRouteVariant | null>(null)
  const [picked, setPicked] = useState<BusStopInfo | null>(null)

  // Both loads are stored WITH the key they were loaded for, so switching
  // operator or route derives "loading" during render instead of resetting
  // state from the effect. A stored `null` list is the failure case.
  const [routeData, setRouteData] = useState<{
    operator: BusOperator
    routes: BusRouteVariant[] | null
  } | null>(null)
  const [stopData, setStopData] = useState<{ key: string; stops: BusStopInfo[] | null } | null>(
    null,
  )

  const routeHit = routeData?.operator === operator ? routeData : null
  const routes = routeHit?.routes ?? null
  const routesLoading = routeHit === null
  const routesError = routeHit !== null && routeHit.routes === null

  const stopsKey = variant === null ? '' : variantKey(variant)
  const stopHit = stopData?.key === stopsKey ? stopData : null
  const stops = stopHit?.stops ?? null
  const stopsError = stopHit !== null && stopHit.stops === null

  useEffect(() => {
    let alive = true
    loadRoutes(operator)
      .then((r) => {
        if (alive) setRouteData({ operator, routes: r })
      })
      .catch(() => {
        if (alive) setRouteData({ operator, routes: null })
      })
    return () => {
      alive = false
    }
  }, [operator])

  useEffect(() => {
    if (variant === null) return
    let alive = true
    const key = variantKey(variant)
    loadRouteStops(variant)
      .then((s) => {
        if (alive) setStopData({ key, stops: s })
      })
      .catch(() => {
        if (alive) setStopData({ key, stops: null })
      })
    return () => {
      alive = false
    }
  }, [variant])

  const hits = useMemo(() => searchRoutes(routes ?? [], query), [routes, query])
  const now = useNow(30_000)
  // One throwaway watch so the preview polls exactly like a saved stop does.
  const preview = useMemo(
    () =>
      variant && picked
        ? [
            {
              id: 'preview',
              operator: variant.operator,
              route: variant.route,
              direction: variant.direction,
              serviceType: variant.serviceType,
              stopId: picked.stopId,
            },
          ]
        : [],
    [variant, picked],
  )
  const feed = useBusEtas(preview)

  const alreadySaved =
    variant !== null &&
    picked !== null &&
    saved.some(
      (s) =>
        busStopKey(s) ===
        busStopKey({
          operator: variant.operator,
          route: variant.route,
          direction: variant.direction,
          serviceType: variant.serviceType,
          stopId: picked.stopId,
        }),
    )

  const add = () => {
    if (!variant || !picked) return
    addBusStop({
      operator: variant.operator,
      route: variant.route,
      direction: variant.direction,
      serviceType: variant.serviceType,
      stopId: picked.stopId,
      stopName: picked.name,
      stopNameTc: picked.nameTc,
      destination: variant.destination,
      destinationTc: variant.destinationTc,
    })
  }

  const clearRoute = () => {
    setVariant(null)
    setPicked(null)
  }

  return (
    <Card accent="violet" title="Find a stop">
      <div className="mb-2 flex items-center gap-1">
        {OPERATORS.map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => {
              setOperator(op)
              clearRoute()
            }}
            className={`rounded-md px-2.5 py-1 text-sm ${
              operator === op
                ? 'bg-violet-100 font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                : 'text-slate-500 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/10'
            }`}
          >
            {operatorName[op]}
          </button>
        ))}
      </div>

      {variant === null ? (
        <>
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute top-2.5 left-2.5 text-slate-400"
            />
            <input
              className={`${inputCls} pl-8`}
              placeholder={routesLoading ? 'Loading routes…' : 'Route number, e.g. 1A'}
              disabled={routes === null}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Route number"
            />
          </div>
          {routesError && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Could not load the {operatorName[operator]} route list. Check the connection and try
              again.
            </p>
          )}
          <div className="mt-1 flex max-h-72 flex-col overflow-y-auto">
            {hits.map((v) => (
              <button key={variantKey(v)} type="button" className={rowCls} onClick={() => setVariant(v)}>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums ${operatorChipCls[v.operator]}`}
                >
                  {v.route}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  to {variantDestination(v, lang)}
                </span>
                {v.serviceType !== undefined && v.serviceType !== '1' && (
                  <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                    variant {v.serviceType}
                  </span>
                )}
              </button>
            ))}
            {query.trim() !== '' && routes !== null && hits.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-slate-400 dark:text-slate-500">
                No {operatorName[operator]} route starts with “{query.trim()}”.
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mb-1 flex items-center gap-2">
            <button type="button" title="Back to routes" className={rowCls} onClick={clearRoute}>
              <ArrowLeft size={14} className="shrink-0 text-slate-400" />
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums ${operatorChipCls[variant.operator]}`}
              >
                {variant.route}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {variantOrigin(variant, lang)} → {variantDestination(variant, lang)}
              </span>
            </button>
          </div>
          {stopsError && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Could not load the stops for this route.
            </p>
          )}
          {stopHit === null && (
            <p className="px-2 py-1.5 text-sm text-slate-400 dark:text-slate-500">Loading stops…</p>
          )}
          <div className="flex max-h-72 flex-col overflow-y-auto">
            {(stops ?? []).map((s, i) => (
              <button
                key={s.stopId}
                type="button"
                className={`${rowCls} ${picked?.stopId === s.stopId ? 'bg-violet-100/60 dark:bg-violet-900/30' : ''}`}
                onClick={() => setPicked(s)}
              >
                <span className="w-5 shrink-0 text-right text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{stopInfoName(s, lang)}</span>
              </button>
            ))}
          </div>
          {picked !== null && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-violet-200 px-2 py-1.5 dark:border-violet-900">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{picked.name}</span>
              <BusArrivals result={feed.byStop.preview} now={now} />
              <button
                type="button"
                onClick={add}
                disabled={alreadySaved}
                title={alreadySaved ? 'Already on the dashboard' : 'Add to the dashboard'}
                className="flex shrink-0 items-center gap-1 rounded-md bg-violet-600 px-2 py-1 text-xs font-medium text-white hover:bg-violet-500 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
              >
                {alreadySaved ? <Check size={12} /> : <Plus size={12} />}
                {alreadySaved ? 'Added' : 'Add'}
              </button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
