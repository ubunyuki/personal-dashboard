import type { BusDirection, BusLanguage, BusOperator } from '../../types'

/**
 * Pure core of the bus feature: everything that turns an operator's JSON into
 * something renderable. KMB and Citybus publish near-identical row shapes
 * (`co`, `route`, `dir`, `eta`, `eta_seq`, `rmk_en`), which is why one set of
 * parsers covers both — the differences are the envelope URL, Citybus having
 * no service types, and each operator's own idea of a route "variant".
 *
 * Every parser takes `unknown` and degrades to empty rather than throwing:
 * these are public feeds that can change shape without notice, and a bus tile
 * that renders nothing is far better than one that takes the dashboard down.
 */

/** Wire code for a direction. Both operators use 'O'/'I'. */
export const dirCode = (d: BusDirection): 'O' | 'I' => (d === 'outbound' ? 'O' : 'I')

export interface BusRouteVariant {
  operator: BusOperator
  route: string
  direction: BusDirection
  /** KMB only. */
  serviceType?: string
  origin: string
  destination: string
  /** Both operators ship the Chinese names in the SAME payload as the English
   *  ones, so reading them costs nothing extra. Optional because a feed that
   *  changes shape must degrade to English, never to a blank row. */
  originTc?: string
  destinationTc?: string
}

export interface BusStopInfo {
  stopId: string
  name: string
  /** See BusRouteVariant.originTc — same payload, same reasoning. */
  nameTc?: string
}

export interface BusEta {
  /** ISO instant, or null when the operator has no time for this slot. */
  at: string | null
  /** Whole minutes from now, FLOORED — "3 min" must not promise a bus that
   *  is really 3m59s away. Negative means it should already have gone. */
  minutes: number | null
  /** Operator remark, e.g. "Scheduled Bus", "Final Bus". */
  remark?: string
  destination?: string
  /** The destination in Chinese. Every arrival carries it, which is how a
   *  stop saved before the names were stored gets its Chinese destination
   *  back without a single extra request — see useBusNameBackfill. */
  destinationTc?: string
}

export interface BusEtaResult {
  etas: BusEta[]
  /** The operator's own data timestamp. Our poll can be a second old while
   *  theirs is twenty minutes stale, and only this tells them apart. */
  feedAt: string | null
}

// ---- shared shape guards ----

function rows(raw: unknown): Array<Record<string, unknown>> {
  const data = (raw as { data?: unknown } | null | undefined)?.data
  if (!Array.isArray(data)) return []
  return data.filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
}

const str = (v: unknown): string | undefined => {
  if (typeof v === 'number') return String(v)
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined
}

// ---- routes ----

/** KMB lists one row per direction AND service type, so "1A" can appear four
 *  times. Each row is already a variant; nothing needs expanding. */
export function parseKmbRoutes(raw: unknown): BusRouteVariant[] {
  const out: BusRouteVariant[] = []
  for (const r of rows(raw)) {
    const route = str(r.route)
    const bound = str(r.bound)
    if (!route || (bound !== 'O' && bound !== 'I')) continue
    out.push({
      operator: 'KMB',
      route,
      direction: bound === 'O' ? 'outbound' : 'inbound',
      serviceType: str(r.service_type),
      origin: str(r.orig_en) ?? '',
      destination: str(r.dest_en) ?? '',
      originTc: str(r.orig_tc),
      destinationTc: str(r.dest_tc),
    })
  }
  return out
}

/** Citybus lists each route ONCE, with orig and dest naming the outbound
 *  journey. The inbound variant is that row read backwards — the API has no
 *  separate entry for it, but its route-stop and ETA endpoints both accept
 *  `inbound`, so the variant is real even though the list omits it. */
export function parseCtbRoutes(raw: unknown): BusRouteVariant[] {
  const out: BusRouteVariant[] = []
  for (const r of rows(raw)) {
    const route = str(r.route)
    if (!route) continue
    const orig = str(r.orig_en) ?? ''
    const dest = str(r.dest_en) ?? ''
    const origTc = str(r.orig_tc)
    const destTc = str(r.dest_tc)
    out.push({
      operator: 'CTB',
      route,
      direction: 'outbound',
      origin: orig,
      destination: dest,
      originTc: origTc,
      destinationTc: destTc,
    })
    out.push({
      operator: 'CTB',
      route,
      direction: 'inbound',
      origin: dest,
      destination: orig,
      originTc: destTc,
      destinationTc: origTc,
    })
  }
  return out
}

/** What the picker shows, in the language the user reads. English is the
 *  fallback everywhere: a feed that omits the Chinese name must still render
 *  a row. Saved stops have their own pair in lib/bus/saved.ts — they read
 *  from stored copies rather than from a live feed. */
export const variantOrigin = (v: BusRouteVariant, lang: BusLanguage): string =>
  (lang === 'tc' ? v.originTc : undefined) ?? v.origin

export const variantDestination = (v: BusRouteVariant, lang: BusLanguage): string =>
  (lang === 'tc' ? v.destinationTc : undefined) ?? v.destination

export const stopInfoName = (s: BusStopInfo, lang: BusLanguage): string =>
  (lang === 'tc' ? s.nameTc : undefined) ?? s.name

/** Stable identity for a variant — a React key, and how a saved stop is
 *  matched back to the route it came from. */
export const variantKey = (v: BusRouteVariant): string =>
  `${v.operator}:${v.route}:${v.direction}:${v.serviceType ?? ''}`

/** Natural route order: 1, 1A, 2, 10, 101 — not the lexicographic 1, 10, 101,
 *  1A, 2 that a plain sort gives. */
export function compareRoutes(a: string, b: string): number {
  const na = parseInt(a, 10)
  const nb = parseInt(b, 10)
  if (Number.isNaN(na) || Number.isNaN(nb)) return a.localeCompare(b)
  if (na !== nb) return na - nb
  return a.localeCompare(b)
}

/**
 * Route-number lookup for the picker. An exact number ranks above a prefix
 * match, so typing "1" puts route 1 above 1A and 101 instead of burying it
 * among the hundred routes that merely start with a 1.
 */
export function searchRoutes(
  variants: BusRouteVariant[],
  query: string,
  limit = 40,
): BusRouteVariant[] {
  const q = query.trim().toUpperCase()
  if (q === '') return []
  const hits = variants.filter((v) => v.route.toUpperCase().startsWith(q))
  hits.sort((a, b) => {
    const ea = a.route.toUpperCase() === q ? 0 : 1
    const eb = b.route.toUpperCase() === q ? 0 : 1
    if (ea !== eb) return ea - eb
    const byRoute = compareRoutes(a.route, b.route)
    if (byRoute !== 0) return byRoute
    if (a.operator !== b.operator) return a.operator.localeCompare(b.operator)
    if (a.direction !== b.direction) return a.direction === 'outbound' ? -1 : 1
    return (a.serviceType ?? '').localeCompare(b.serviceType ?? '')
  })
  return hits.slice(0, limit)
}

// ---- stops ----

/** Ordered stop ids for one route variant. KMB calls the direction `bound`
 *  and Citybus calls it `dir`; both are read so one parser covers them. */
export function parseRouteStops(raw: unknown, direction: BusDirection): string[] {
  const want = dirCode(direction)
  return rows(raw)
    .filter((r) => (str(r.bound) ?? str(r.dir)) === want)
    .map((r) => ({ seq: Number(r.seq ?? 0), stop: str(r.stop) }))
    .filter((r): r is { seq: number; stop: string } => r.stop !== undefined)
    .sort((a, b) => a.seq - b.seq)
    .map((r) => r.stop)
}

/** The stop endpoint returns a single object, not a list. */
export function parseStopInfo(raw: unknown): BusStopInfo | null {
  const d = (raw as { data?: unknown } | null | undefined)?.data
  if (typeof d !== 'object' || d === null || Array.isArray(d)) return null
  const row = d as Record<string, unknown>
  const stopId = str(row.stop)
  const name = str(row.name_en)
  return stopId && name ? { stopId, name, nameTc: str(row.name_tc) } : null
}

// ---- arrivals ----

export function minutesUntil(iso: string, now: Date): number | null {
  const t = Date.parse(iso)
  return Number.isNaN(t) ? null : Math.floor((t - now.getTime()) / 60_000)
}

/**
 * Arrivals for ONE route variant at one stop.
 *
 * The filtering is the load-bearing part: a stop served in both directions
 * returns both in the same response, and a KMB stop shared by route variants
 * returns all of them — so an unfiltered render would show a user the bus
 * going the other way.
 */
export function parseEtas(
  raw: unknown,
  opts: { direction: BusDirection; serviceType?: string },
  now: Date,
): BusEtaResult {
  const want = dirCode(opts.direction)
  const all = rows(raw)
  // Read off ANY row: the timestamp describes the whole response, and the
  // rows we drop carry it just as well as the ones we keep.
  const feedAt = all.map((r) => str(r.data_timestamp)).find((v) => v !== undefined) ?? null
  const picked = all.filter((r) => {
    if ((str(r.dir) ?? str(r.bound)) !== want) return false
    // Citybus sends no service_type at all, so an absent one never excludes.
    if (opts.serviceType !== undefined && r.service_type !== undefined) {
      if (str(r.service_type) !== opts.serviceType) return false
    }
    return true
  })
  picked.sort((a, b) => Number(a.eta_seq ?? 0) - Number(b.eta_seq ?? 0))
  const etas = picked.map((r) => {
    const at = str(r.eta) ?? null
    return {
      at,
      minutes: at === null ? null : minutesUntil(at, now),
      remark: str(r.rmk_en),
      destination: str(r.dest_en),
      destinationTc: str(r.dest_tc),
    }
  })
  return { etas, feedAt }
}

/** "Due" rather than "0 min", and an em dash when the operator gave no time
 *  — usually the last bus of the night has gone. */
export function formatEta(minutes: number | null): string {
  if (minutes === null) return '—'
  if (minutes <= 0) return 'Due'
  return `${minutes} min`
}

/** The operator's feed has gone quiet. Their own timestamps run a few seconds
 *  behind real time, so the threshold is minutes, not seconds. */
export function isFeedStale(feedAt: string | null, now: Date, maxAgeMs = 5 * 60_000): boolean {
  if (feedAt === null) return false
  const t = Date.parse(feedAt)
  return Number.isNaN(t) ? false : now.getTime() - t > maxAgeMs
}

/** What the tile puts under the route number when there is no time to show. */
export function etaSummary(result: BusEtaResult): string | null {
  if (result.etas.length === 0) return 'No arrivals scheduled'
  if (result.etas.every((e) => e.at === null)) {
    return result.etas.find((e) => e.remark)?.remark ?? 'No arrivals scheduled'
  }
  return null
}
