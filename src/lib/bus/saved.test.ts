import { describe, expect, it } from 'vitest'
import type { SavedBusStop } from '../../types'
import {
  busStopDestination,
  busStopKey,
  busStopName,
  busStopTitle,
  moveBusStopIn,
  sortBusStops,
} from './saved'

let n = 0
function stop(over: Partial<SavedBusStop> = {}): SavedBusStop {
  n++
  return {
    id: `s${n}`,
    operator: 'KMB',
    route: '1A',
    direction: 'outbound',
    serviceType: '1',
    stopId: `stop${n}`,
    stopName: `Stop ${n}`,
    destination: 'STAR FERRY',
    createdAt: `2026-09-1${n}T08:00:00.000Z`,
    updatedAt: `2026-09-1${n}T08:00:00.000Z`,
    ...over,
  }
}

describe('busStopKey', () => {
  it('separates the same shelter across routes and directions', () => {
    const base = { operator: 'KMB', route: '1A', direction: 'outbound', stopId: 'X' } as const
    expect(busStopKey(base)).not.toBe(busStopKey({ ...base, direction: 'inbound' }))
    expect(busStopKey(base)).not.toBe(busStopKey({ ...base, route: '1' }))
    expect(busStopKey(base)).not.toBe(busStopKey({ ...base, operator: 'CTB' }))
    // An absent service type is its own value, not a wildcard.
    expect(busStopKey({ ...base, serviceType: '1' })).not.toBe(busStopKey(base))
  })
})

describe('sortBusStops', () => {
  it('puts ranked stops first and leaves the rest in the order they were added', () => {
    const a = stop()
    const b = stop()
    const c = stop({ order: 0 })
    expect(sortBusStops([a, b, c]).map((s) => s.id)).toEqual([c.id, a.id, b.id])
  })
})

describe('moveBusStopIn', () => {
  it('swaps with the neighbour and materializes a rank onto every stop', () => {
    const stops = [stop(), stop(), stop()]
    const moved = moveBusStopIn(stops, stops[2].id, -1)
    expect(moved.map((s) => s.order)).toEqual([0, 2, 1])
    expect(sortBusStops(moved).map((s) => s.id)).toEqual([stops[0].id, stops[2].id, stops[1].id])
  })

  it('no-ops at the edges and for an unknown id (same reference back)', () => {
    const stops = [stop(), stop()]
    expect(moveBusStopIn(stops, stops[0].id, -1)).toBe(stops)
    expect(moveBusStopIn(stops, stops[1].id, 1)).toBe(stops)
    expect(moveBusStopIn(stops, 'missing', 1)).toBe(stops)
  })
})

describe('busStopTitle', () => {
  it('prefers the user label and ignores one that is only whitespace', () => {
    expect(busStopTitle(stop({ label: 'Home → Office' }), 'en')).toBe('Home → Office')
    expect(busStopTitle(stop({ stopName: 'SAU MAU PING', label: '   ' }), 'en')).toBe('SAU MAU PING')
  })

  it('shows the Chinese name when asked for it, and a label in either language', () => {
    const s = stop({ stopName: 'SAU MAU PING', stopNameTc: '秀茂坪' })
    expect(busStopTitle(s, 'tc')).toBe('秀茂坪')
    expect(busStopTitle(s, 'en')).toBe('SAU MAU PING')
    // A label is already in whatever language it was typed in.
    expect(busStopTitle(stop({ stopNameTc: '秀茂坪', label: 'Home' }), 'tc')).toBe('Home')
  })
})

describe('busStopName / busStopDestination', () => {
  it('falls back to English for a stop saved before the Chinese names were', () => {
    const s = stop({ stopName: 'SAU MAU PING', destination: 'STAR FERRY' })
    expect(busStopName(s, 'tc')).toBe('SAU MAU PING')
    expect(busStopDestination(s, 'tc')).toBe('STAR FERRY')
  })

  it('uses the Chinese destination once the backfill has stored one', () => {
    expect(busStopDestination(stop({ destinationTc: '尖沙咀碼頭' }), 'tc')).toBe('尖沙咀碼頭')
    expect(busStopDestination(stop({ destinationTc: '尖沙咀碼頭' }), 'en')).toBe('STAR FERRY')
  })
})
