import type { BusDirection, BusOperator } from '../../types'
import { cachedDaily } from './cache'
import {
  parseCtbRoutes,
  parseEtas,
  parseKmbRoutes,
  parseRouteStops,
  parseStopInfo,
  variantKey,
  type BusEtaResult,
  type BusRouteVariant,
  type BusStopInfo,
} from './eta'

/**
 * The only place the bus feature touches the network, mirroring the
 * weather/providers.ts + weather/weather.ts split: parsing lives in eta.ts
 * and is node-testable, this file is the thin impure shell.
 *
 * Both APIs are keyless and CORS-open, so there is nothing to proxy.
 */

const KMB = 'https://data.etabus.gov.hk/v1/transport/kmb'
const CTB = 'https://rt.data.gov.hk/v2/transport/citybus'

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Bus API ${res.status}`)
  return await res.json()
}

/** Every route variant an operator runs. ~350 KB for KMB and ~110 KB for
 *  Citybus, which is why this is the one call that is always cached. */
export async function loadRoutes(operator: BusOperator): Promise<BusRouteVariant[]> {
  return cachedDaily(`bus-routes:${operator}`, async () =>
    operator === 'KMB'
      ? parseKmbRoutes(await getJson(`${KMB}/route/`))
      : parseCtbRoutes(await getJson(`${CTB}/route/CTB`)),
  )
}

/** Resolve up to `limit` promises at a time. A route can have fifty stops and
 *  each name is its own request; firing them all at once is rude to a public
 *  endpoint and gains nothing over a few in flight. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (let i = next++; i < items.length; i = next++) out[i] = await fn(items[i])
  })
  await Promise.all(workers)
  return out
}

/**
 * The stops along one route variant, in travelling order and with names.
 *
 * The stop ids come back in one small request; the names do not, so each is
 * fetched separately. The whole resolved list is cached under the variant, so
 * that cost is paid once a day per route the user actually opens.
 */
export async function loadRouteStops(v: BusRouteVariant): Promise<BusStopInfo[]> {
  return cachedDaily(`bus-route-stops:${variantKey(v)}`, async () => {
    const url =
      v.operator === 'KMB'
        ? `${KMB}/route-stop/${encodeURIComponent(v.route)}/${v.direction}/${v.serviceType ?? '1'}`
        : `${CTB}/route-stop/CTB/${encodeURIComponent(v.route)}/${v.direction}`
    const ids = parseRouteStops(await getJson(url), v.direction)
    const infos = await mapLimit(ids, 8, async (stopId) => {
      try {
        const base = v.operator === 'KMB' ? `${KMB}/stop/${stopId}` : `${CTB}/stop/${stopId}`
        return parseStopInfo(await getJson(base))
      } catch {
        return null
      }
    })
    // A stop whose name would not resolve is still a real stop on the route,
    // so it stays in sequence under its id rather than silently vanishing.
    return ids.map((stopId, i) => infos[i] ?? { stopId, name: stopId })
  })
}

/**
 * One stop's names, on its own rather than as part of a route.
 *
 * loadRouteStops already fetches this for every stop on a route; this is the
 * single-stop door into the same endpoint, used to give a stop saved before
 * v6 its Chinese name without making the user add it again. Cached daily
 * under its own key, so the backfill costs one request per stop, once.
 */
export async function loadStopInfo(
  operator: BusOperator,
  stopId: string,
): Promise<BusStopInfo | null> {
  return cachedDaily(`bus-stop:${operator}:${stopId}`, async () =>
    parseStopInfo(
      await getJson(operator === 'KMB' ? `${KMB}/stop/${stopId}` : `${CTB}/stop/${stopId}`),
    ),
  )
}

export interface EtaQuery {
  operator: BusOperator
  route: string
  direction: BusDirection
  serviceType?: string
  stopId: string
}

/** Live arrivals. Never cached — a cached ETA is a wrong ETA. */
export async function fetchEtas(q: EtaQuery, now: Date): Promise<BusEtaResult> {
  const url =
    q.operator === 'KMB'
      ? `${KMB}/eta/${q.stopId}/${encodeURIComponent(q.route)}/${q.serviceType ?? '1'}`
      : `${CTB}/eta/CTB/${q.stopId}/${encodeURIComponent(q.route)}`
  return parseEtas(await getJson(url), { direction: q.direction, serviceType: q.serviceType }, now)
}
