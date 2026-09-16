import { describe, expect, it } from 'vitest'
import {
  compareRoutes,
  etaSummary,
  formatEta,
  isFeedStale,
  minutesUntil,
  parseCtbRoutes,
  parseEtas,
  parseKmbRoutes,
  parseRouteStops,
  parseStopInfo,
  searchRoutes,
  variantKey,
} from './eta'

const NOW = new Date('2026-09-17T01:17:00+08:00')

/** Trimmed from a live data.etabus.gov.hk response: one stop, both
 *  directions, a null ETA and a "Final Bus" remark. */
const KMB_ETA = {
  type: 'ETA',
  data: [
    {
      co: 'KMB',
      route: '1A',
      dir: 'O',
      service_type: 1,
      dest_en: 'STAR FERRY',
      eta_seq: 1,
      eta: null,
      rmk_en: '',
      data_timestamp: '2026-09-17T01:17:07+08:00',
    },
    {
      co: 'KMB',
      route: '1A',
      dir: 'I',
      service_type: 1,
      dest_en: 'SAU MAU PING (CENTRAL)',
      eta_seq: 2,
      eta: '2026-09-17T01:32:50+08:00',
      rmk_en: 'Final Bus',
      data_timestamp: '2026-09-17T01:17:07+08:00',
    },
    {
      co: 'KMB',
      route: '1A',
      dir: 'I',
      service_type: 1,
      dest_en: 'SAU MAU PING (CENTRAL)',
      eta_seq: 1,
      eta: '2026-09-17T01:22:59+08:00',
      rmk_en: '',
      data_timestamp: '2026-09-17T01:17:07+08:00',
    },
  ],
}

describe('parseKmbRoutes', () => {
  it('reads each bound as its own variant and keeps the service type', () => {
    const out = parseKmbRoutes({
      data: [
        { route: '1A', bound: 'O', service_type: '1', orig_en: 'SAU MAU PING', dest_en: 'STAR FERRY' },
        { route: '1A', bound: 'I', service_type: '1', orig_en: 'STAR FERRY', dest_en: 'SAU MAU PING' },
        { route: 'broken', bound: 'X' },
      ],
    })
    expect(out).toEqual([
      {
        operator: 'KMB',
        route: '1A',
        direction: 'outbound',
        serviceType: '1',
        origin: 'SAU MAU PING',
        destination: 'STAR FERRY',
      },
      {
        operator: 'KMB',
        route: '1A',
        direction: 'inbound',
        serviceType: '1',
        origin: 'STAR FERRY',
        destination: 'SAU MAU PING',
      },
    ])
  })

  it('returns nothing for a shape it does not recognise', () => {
    expect(parseKmbRoutes(null)).toEqual([])
    expect(parseKmbRoutes({ data: 'nope' })).toEqual([])
  })
})

describe('parseCtbRoutes', () => {
  it('expands one listed route into both directions', () => {
    const out = parseCtbRoutes({
      data: [{ route: '1', orig_en: 'Central (Macao Ferry)', dest_en: 'Happy Valley (Upper)' }],
    })
    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({ direction: 'outbound', origin: 'Central (Macao Ferry)' })
    // The inbound variant is the same row read backwards — Citybus never
    // lists it, but its route-stop and ETA endpoints both serve it.
    expect(out[1]).toMatchObject({
      direction: 'inbound',
      origin: 'Happy Valley (Upper)',
      destination: 'Central (Macao Ferry)',
    })
    expect(out[0].serviceType).toBeUndefined()
  })
})

describe('searchRoutes', () => {
  const variants = [
    ...parseKmbRoutes({
      data: [
        { route: '1', bound: 'O', service_type: '1', orig_en: 'A', dest_en: 'B' },
        { route: '1A', bound: 'O', service_type: '1', orig_en: 'A', dest_en: 'B' },
        { route: '101', bound: 'O', service_type: '1', orig_en: 'A', dest_en: 'B' },
        { route: '2', bound: 'O', service_type: '1', orig_en: 'A', dest_en: 'B' },
      ],
    }),
  ]

  it('ranks the exact route number above everything that merely starts with it', () => {
    expect(searchRoutes(variants, '1').map((v) => v.route)).toEqual(['1', '1A', '101'])
  })

  it('is case-insensitive and ignores surrounding space', () => {
    expect(searchRoutes(variants, ' 1a ').map((v) => v.route)).toEqual(['1A'])
  })

  it('returns nothing for an empty query rather than the whole network', () => {
    expect(searchRoutes(variants, '   ')).toEqual([])
  })
})

describe('compareRoutes', () => {
  it('orders route numbers the way a person reads them', () => {
    expect(['101', '1A', '2', '1', '10'].sort(compareRoutes)).toEqual(['1', '1A', '2', '10', '101'])
  })

  it('falls back to text for lettered routes', () => {
    expect(['X1', 'A10', 'A1'].sort(compareRoutes)).toEqual(['A1', 'A10', 'X1'])
  })
})

describe('variantKey', () => {
  it('separates the same route number across operators and directions', () => {
    const [kmb] = parseKmbRoutes({ data: [{ route: '1', bound: 'O', service_type: '1' }] })
    const [ctbOut, ctbIn] = parseCtbRoutes({ data: [{ route: '1' }] })
    expect(new Set([kmb, ctbOut, ctbIn].map(variantKey)).size).toBe(3)
  })
})

describe('parseRouteStops', () => {
  it('keeps one direction, in travelling order', () => {
    const ids = parseRouteStops(
      {
        data: [
          { bound: 'O', seq: '3', stop: 'c' },
          { bound: 'O', seq: '1', stop: 'a' },
          { bound: 'I', seq: '1', stop: 'z' },
          { bound: 'O', seq: '2', stop: 'b' },
        ],
      },
      'outbound',
    )
    expect(ids).toEqual(['a', 'b', 'c'])
  })

  it("reads Citybus's `dir` as well as KMB's `bound`", () => {
    const ids = parseRouteStops({ data: [{ dir: 'I', seq: 1, stop: '001027' }] }, 'inbound')
    expect(ids).toEqual(['001027'])
  })
})

describe('parseStopInfo', () => {
  it('reads the single-object payload', () => {
    expect(
      parseStopInfo({ data: { stop: 'A3ADFCDF8487ADB9', name_en: 'SAU MAU PING (CENTRAL) (KT975)' } }),
    ).toEqual({ stopId: 'A3ADFCDF8487ADB9', name: 'SAU MAU PING (CENTRAL) (KT975)' })
  })

  it('is null for a list, a miss, or a nameless stop', () => {
    expect(parseStopInfo({ data: [] })).toBeNull()
    expect(parseStopInfo({})).toBeNull()
    expect(parseStopInfo({ data: { stop: 'x' } })).toBeNull()
  })
})

describe('minutesUntil', () => {
  it('floors, so a bus 3m59s away is never announced as 4 min', () => {
    expect(minutesUntil('2026-09-17T01:20:59+08:00', NOW)).toBe(3)
    expect(minutesUntil('2026-09-17T01:16:30+08:00', NOW)).toBe(-1)
  })

  it('is null for an unparseable time', () => {
    expect(minutesUntil('soon', NOW)).toBeNull()
  })
})

describe('parseEtas', () => {
  it('drops the other direction and orders by the operator sequence', () => {
    const r = parseEtas(KMB_ETA, { direction: 'inbound', serviceType: '1' }, NOW)
    expect(r.etas.map((e) => e.minutes)).toEqual([5, 15])
    expect(r.etas[1].remark).toBe('Final Bus')
    expect(r.feedAt).toBe('2026-09-17T01:17:07+08:00')
  })

  it('keeps a null eta as a row, since the remark explains the gap', () => {
    const r = parseEtas(KMB_ETA, { direction: 'outbound', serviceType: '1' }, NOW)
    expect(r.etas).toEqual([
      { at: null, minutes: null, remark: undefined, destination: 'STAR FERRY' },
    ])
  })

  it('drops other KMB service types on a shared stop', () => {
    const r = parseEtas(KMB_ETA, { direction: 'inbound', serviceType: '2' }, NOW)
    expect(r.etas).toEqual([])
  })

  it('never excludes a Citybus row, which carries no service type at all', () => {
    const ctb = {
      data: [
        {
          co: 'CTB',
          route: '1',
          dir: 'O',
          dest_en: 'Happy Valley (Upper)',
          eta_seq: 1,
          eta: '2026-09-17T01:22:00+08:00',
          data_timestamp: '2026-09-17T01:17:00+08:00',
        },
      ],
    }
    expect(parseEtas(ctb, { direction: 'outbound', serviceType: '1' }, NOW).etas).toHaveLength(1)
  })

  it('is empty, not thrown, for a shape it does not recognise', () => {
    expect(parseEtas(undefined, { direction: 'outbound' }, NOW)).toEqual({ etas: [], feedAt: null })
  })
})

describe('formatEta', () => {
  it('says Due at or past zero and an em dash for no time', () => {
    expect(formatEta(null)).toBe('—')
    expect(formatEta(-2)).toBe('Due')
    expect(formatEta(0)).toBe('Due')
    expect(formatEta(1)).toBe('1 min')
    expect(formatEta(12)).toBe('12 min')
  })
})

describe('isFeedStale', () => {
  it('flags the operator going quiet, not our own poll being a second old', () => {
    expect(isFeedStale('2026-09-17T01:16:30+08:00', NOW)).toBe(false)
    expect(isFeedStale('2026-09-17T01:05:00+08:00', NOW)).toBe(true)
    expect(isFeedStale(null, NOW)).toBe(false)
  })
})

describe('etaSummary', () => {
  it('explains an empty board, and defers to the remark when there is one', () => {
    expect(etaSummary({ etas: [], feedAt: null })).toBe('No arrivals scheduled')
    expect(
      etaSummary({ etas: [{ at: null, minutes: null, remark: 'Final Bus' }], feedAt: null }),
    ).toBe('Final Bus')
    expect(etaSummary({ etas: [{ at: 'x', minutes: 3 }], feedAt: null })).toBeNull()
  })
})
