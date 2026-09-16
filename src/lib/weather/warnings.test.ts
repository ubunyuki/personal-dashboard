import { describe, expect, it } from 'vitest'
import {
  WARNING_ICONS,
  backoffDelay,
  describeDiff,
  diffWarnings,
  iconFor,
  jitter,
  labelFor,
  parseSwt,
  parseWarningInfo,
  parseWarnsum,
  type Warning,
} from './warnings'

/** Shape copied from a live warnsum response during a No. 8 with rain. */
const LIVE = {
  WTCSGNL: {
    code: 'TC8NE',
    name: 'Tropical Cyclone Warning Signal',
    type: 'Increasing Gale or Storm Signal No. 8 North East',
    actionCode: 'ISSUE',
    issueTime: '2026-09-14T14:20:00+08:00',
    updateTime: '2026-09-14T14:20:00+08:00',
  },
  WRAIN: {
    code: 'WRAINA',
    name: 'Rainstorm Warning Signal',
    type: 'Amber',
    actionCode: 'ISSUE',
    issueTime: '2026-09-14T13:05:00+08:00',
    updateTime: '2026-09-14T13:05:00+08:00',
  },
}

const w = (over: Partial<Warning> = {}): Warning => ({
  statement: 'WTCSGNL',
  code: 'TC1',
  name: 'Tropical Cyclone Warning Signal',
  actionCode: 'ISSUE',
  ...over,
})

describe('parseWarnsum', () => {
  it('returns nothing for the quiet response', () => {
    // The endpoint sends a bare `{}` — not an empty array, not a null field.
    expect(parseWarnsum({})).toEqual([])
  })

  it('normalises live entries and orders them worst-first', () => {
    const got = parseWarnsum(LIVE)
    expect(got.map((x) => x.code)).toEqual(['TC8NE', 'WRAINA'])
    expect(got[0]).toEqual({
      statement: 'WTCSGNL',
      code: 'TC8NE',
      name: 'Tropical Cyclone Warning Signal',
      type: 'Increasing Gale or Storm Signal No. 8 North East',
      actionCode: 'ISSUE',
      issueTime: '2026-09-14T14:20:00+08:00',
      updateTime: '2026-09-14T14:20:00+08:00',
    })
  })

  it('drops cancellations — a withdrawn signal is not a hoisted one', () => {
    expect(
      parseWarnsum({
        WTCSGNL: { code: 'CANCEL', name: 'Tropical Cyclone Warning Signal' },
        WTS: { code: 'WTS', name: 'Thunderstorm Warning', actionCode: 'CANCEL' },
      }),
    ).toEqual([])
  })

  it('degrades to empty rather than throwing on junk', () => {
    expect(parseWarnsum(null)).toEqual([])
    expect(parseWarnsum([])).toEqual([])
    expect(parseWarnsum('WTCSGNL')).toEqual([])
    expect(parseWarnsum({ WTCSGNL: null })).toEqual([])
    expect(parseWarnsum({ WTCSGNL: { name: 'no code field' } })).toEqual([])
  })

  it('falls back to the statement code when name is missing', () => {
    expect(parseWarnsum({ WL: { code: 'WL' } })[0]).toMatchObject({ name: 'WL' })
  })
})

describe('icons', () => {
  it('maps every bundled icon and resolves a URL', () => {
    expect(iconFor(w({ code: 'TC8NE' }))).toBe('/hko/tc8ne.gif')
    expect(iconFor(w({ code: 'WRAINB' }))).toBe('/hko/rainb.gif')
  })

  it('returns undefined for a code HKO added after the icons were fetched', () => {
    expect(iconFor(w({ code: 'WNEWTHING' }))).toBeUndefined()
  })

  it('covers all three rainstorm severities with distinct files', () => {
    const rain = [WARNING_ICONS.WRAINA, WARNING_ICONS.WRAINR, WARNING_ICONS.WRAINB]
    expect(new Set(rain).size).toBe(3)
  })
})

describe('labelFor', () => {
  it('appends the severity word when there is one', () => {
    expect(labelFor(w({ name: 'Rainstorm Warning Signal', type: 'Black' }))).toBe(
      'Rainstorm Warning Signal — Black',
    )
    expect(labelFor(w({ name: 'Landslip Warning' }))).toBe('Landslip Warning')
  })
})

describe('diffWarnings', () => {
  const tc1 = w({ code: 'TC1' })
  const tc8 = w({ code: 'TC8NE' })

  it('treats the first poll of a session as no change', () => {
    // Otherwise every launch during a typhoon alarms the user about a signal
    // they already know is up.
    expect(diffWarnings(null, [tc8]).changed).toBe(false)
  })

  it('stays silent across identical polls', () => {
    // This is the 1,439-times-a-day case; a false positive here is the bug
    // that would only be discovered during an actual typhoon.
    expect(diffWarnings([tc8], [{ ...tc8 }]).changed).toBe(false)
    expect(diffWarnings([], []).changed).toBe(false)
  })

  it('ignores reordering and non-identity fields', () => {
    const rain = w({ statement: 'WRAIN', code: 'WRAINA' })
    const same = diffWarnings(
      [tc8, rain],
      [
        { ...rain, updateTime: '2026-09-14T15:00:00+08:00' },
        { ...tc8, issueTime: '2026-09-14T15:00:00+08:00' },
      ],
    )
    expect(same.changed).toBe(false)
  })

  it('reports a newly hoisted signal', () => {
    const d = diffWarnings([], [tc1])
    expect(d.changed).toBe(true)
    expect(d.added.map((x) => x.code)).toEqual(['TC1'])
    expect(d.removed).toEqual([])
  })

  it('reports an escalation as both added and removed', () => {
    const d = diffWarnings([tc1], [tc8])
    expect(d.added.map((x) => x.code)).toEqual(['TC8NE'])
    expect(d.removed.map((x) => x.code)).toEqual(['TC1'])
  })

  it('catches a re-issue that keeps the same code', () => {
    // WTS is EXTENDed rather than re-issued, so actionCode is the only field
    // that moves — but it is still news.
    const ts = w({ statement: 'WTS', code: 'WTS', name: 'Thunderstorm Warning' })
    const d = diffWarnings([ts], [{ ...ts, actionCode: 'EXTEND' }])
    expect(d.changed).toBe(true)
    expect(d.added).toHaveLength(1)
    expect(d.removed).toHaveLength(1)
  })

  it('reports a cancellation', () => {
    const d = diffWarnings([tc8], [])
    expect(d.changed).toBe(true)
    expect(d.removed.map((x) => x.code)).toEqual(['TC8NE'])
  })
})

describe('describeDiff', () => {
  it('summarises additions and cancellations in one line', () => {
    const tc8 = w({ code: 'TC8NE', type: 'Gale or Storm Signal No. 8 North East' })
    const rain = w({ statement: 'WRAIN', code: 'WRAINA', name: 'Rainstorm Warning Signal' })
    expect(describeDiff(diffWarnings([rain], [tc8]))).toBe(
      'Tropical Cyclone Warning Signal — Gale or Storm Signal No. 8 North East · ' +
        'Cancelled: Rainstorm Warning Signal',
    )
    expect(describeDiff(diffWarnings([], []))).toBe('')
  })
})

describe('parseSwt', () => {
  it('returns nothing for the quiet response', () => {
    expect(parseSwt({ swt: [] })).toEqual([])
  })

  it('reads the pre-announcement HKO issues before a signal goes up', () => {
    expect(
      parseSwt({
        swt: [
          {
            updateTime: '2026-09-14T13:47:00+08:00',
            desc: '  The Tropical Cyclone Warning Signal Number 8 is expected to be issued at or before 4:07 p.m.  ',
          },
        ],
      }),
    ).toEqual([
      {
        updateTime: '2026-09-14T13:47:00+08:00',
        desc: 'The Tropical Cyclone Warning Signal Number 8 is expected to be issued at or before 4:07 p.m.',
      },
    ])
  })

  it('degrades to empty rather than throwing on junk', () => {
    expect(parseSwt(null)).toEqual([])
    expect(parseSwt({})).toEqual([])
    expect(parseSwt({ swt: [null, 'x', { desc: '   ' }, { updateTime: 'x' }] })).toEqual([])
  })
})

describe('parseWarningInfo', () => {
  it('keys detail paragraphs by statement code', () => {
    expect(
      parseWarningInfo({
        details: [
          {
            contents: ['The Amber Rainstorm Warning is in force.', ''],
            warningStatementCode: 'WRAIN',
            updateTime: '2026-09-14T13:05:00+08:00',
          },
          // warningInfo carries this one; warnsum never does.
          { contents: ['No. 8 expected within two hours.'], warningStatementCode: 'WTCPRE8' },
        ],
      }),
    ).toEqual({
      WRAIN: ['The Amber Rainstorm Warning is in force.'],
      WTCPRE8: ['No. 8 expected within two hours.'],
    })
  })

  it('degrades to empty rather than throwing on junk', () => {
    expect(parseWarningInfo({})).toEqual({})
    expect(parseWarningInfo(null)).toEqual({})
    expect(parseWarningInfo({ details: [{ contents: 'not an array' }] })).toEqual({})
  })
})

describe('poll pacing', () => {
  it('backs off 1m → 2m → 5m and then holds', () => {
    expect(backoffDelay(0)).toBe(60_000)
    expect(backoffDelay(1)).toBe(120_000)
    expect(backoffDelay(2)).toBe(300_000)
    expect(backoffDelay(9)).toBe(300_000)
    expect(backoffDelay(-1)).toBe(60_000)
  })

  it('spreads requests across 0–5s', () => {
    expect(jitter(0)).toBe(0)
    expect(jitter(0.5)).toBe(2_500)
    expect(jitter(0.999_999)).toBeLessThan(5_000)
  })
})
