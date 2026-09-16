import type { SavedBusStop } from '../../types'

/**
 * Order and identity for the user's watched stops, following the same shape
 * as features/notes/ordering.ts: `order` is an optional rank that only
 * exists once something has been moved, so every read falls back rather than
 * reading a bare `stop.order`.
 */

/**
 * Two saved stops are the same watch when they would poll the same endpoint
 * with the same filter. The stop id alone is not enough: one shelter serves
 * several routes, and one route can pass it in both directions.
 */
export const busStopKey = (s: Pick<SavedBusStop, 'operator' | 'route' | 'direction' | 'serviceType' | 'stopId'>): string =>
  `${s.operator}:${s.route}:${s.direction}:${s.serviceType ?? ''}:${s.stopId}`

/** Ranked stops lead in rank order; the rest trail oldest first, which is
 *  the order they were added in. */
export function sortBusStops(stops: SavedBusStop[]): SavedBusStop[] {
  return [...stops].sort((a, b) => {
    const oa = a.order
    const ob = b.order
    if (oa !== undefined && ob !== undefined) return oa - ob || a.createdAt.localeCompare(b.createdAt)
    if (oa !== undefined) return -1
    if (ob !== undefined) return 1
    return a.createdAt.localeCompare(b.createdAt)
  })
}

/** Pure core of moveBusStop — swap with the neighbour in display order, then
 *  materialize order = index onto every stop. Returns the input unchanged for
 *  a no-op, which is how the store action skips the write. */
export function moveBusStopIn(stops: SavedBusStop[], id: string, delta: -1 | 1): SavedBusStop[] {
  const order = sortBusStops(stops)
  const i = order.findIndex((s) => s.id === id)
  const j = i + delta
  if (i < 0 || j < 0 || j >= order.length) return stops
  ;[order[i], order[j]] = [order[j], order[i]]
  const rank = new Map(order.map((s, index) => [s.id, index]))
  return stops.map((s) => {
    const r = rank.get(s.id)
    return r === undefined || s.order === r ? s : { ...s, order: r }
  })
}

/** What the row and tile show as the stop's name: the user's own label wins,
 *  because "Home → Office" is why they saved it. */
export const busStopTitle = (s: SavedBusStop): string => s.label?.trim() || s.stopName
