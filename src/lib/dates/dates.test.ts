import { describe, expect, it } from 'vitest'
import { buildMonthGrid, dueBucketOf, hkHolidayName } from './dates'
import { HK_HOLIDAYS, HK_HOLIDAY_YEARS } from './hkHolidays'

const NOW = new Date(2026, 8, 14, 12, 0, 0) // Mon 14 Sep 2026, 12:00 local

describe('dueBucketOf', () => {
  it('classifies by local calendar date', () => {
    expect(dueBucketOf({ dueDate: '2026-09-13' }, NOW)).toBe('overdue')
    expect(dueBucketOf({ dueDate: '2026-09-14' }, NOW)).toBe('today')
    expect(dueBucketOf({ dueDate: '2026-09-21' }, NOW)).toBe('week')
    expect(dueBucketOf({ dueDate: '2026-09-22' }, NOW)).toBe('later')
    expect(dueBucketOf({}, NOW)).toBe('none')
  })

  it('honors due time on the current day', () => {
    expect(dueBucketOf({ dueDate: '2026-09-14', dueTime: '09:00' }, NOW)).toBe('overdue')
    expect(dueBucketOf({ dueDate: '2026-09-14', dueTime: '15:00' }, NOW)).toBe('today')
  })
})

describe('buildMonthGrid', () => {
  it('always yields 42 contiguous cells starting on a Monday', () => {
    const grid = buildMonthGrid(2026, 8, 1) // September 2026
    expect(grid).toHaveLength(42)
    expect(grid[0].date).toBe('2026-08-31') // Monday before Tue 1 Sep
    expect(new Date(2026, 7, 31).getDay()).toBe(1)
    for (let i = 1; i < grid.length; i++) {
      expect(grid[i].date > grid[i - 1].date).toBe(true)
    }
  })

  it('starts the week on Sunday when asked', () => {
    const grid = buildMonthGrid(2026, 8, 0) // September 2026
    expect(grid).toHaveLength(42)
    expect(grid[0].date).toBe('2026-08-30') // Sunday before Tue 1 Sep
    expect(new Date(2026, 7, 30).getDay()).toBe(0)
  })

  it('crosses the year boundary correctly', () => {
    const grid = buildMonthGrid(2027, 0, 1) // January 2027 starts on a Friday
    expect(grid[0].date).toBe('2026-12-28')
    expect(grid[0].inMonth).toBe(false)
    expect(grid.find((c) => c.date === '2027-01-01')?.inMonth).toBe(true)
    expect(grid[41].date).toBe('2027-02-07')
  })

  it('carries the real weekday, independent of the column', () => {
    const mon = buildMonthGrid(2026, 8, 1)
    const sun = buildMonthGrid(2026, 8, 0)
    // Same calendar day, different column, same weekday.
    const pick = (g: typeof mon) => g.find((c) => c.date === '2026-09-20')
    expect(pick(mon)?.weekday).toBe(0)
    expect(pick(sun)?.weekday).toBe(0)
    expect(mon.indexOf(pick(mon)!) % 7).toBe(6)
    expect(sun.indexOf(pick(sun)!) % 7).toBe(0)
  })

  it('marks out-of-month cells', () => {
    const grid = buildMonthGrid(2026, 8, 1)
    expect(grid.filter((c) => c.inMonth)).toHaveLength(30)
  })
})

describe('hkHolidayName', () => {
  it('names a gazetted holiday and returns undefined for a working day', () => {
    expect(hkHolidayName('2026-07-01')).toBe(
      'Hong Kong Special Administrative Region Establishment Day',
    )
    expect(hkHolidayName('2026-09-16')).toBeUndefined()
  })

  it('covers the Easter/Ching Ming block that runs 3–7 April 2026', () => {
    // Four gazetted days with a working Sunday (5 Apr) in the middle — the
    // case where treating the block as one range would be wrong.
    expect(hkHolidayName('2026-04-03')).toBe('Good Friday')
    expect(hkHolidayName('2026-04-04')).toBe('The day following Good Friday')
    expect(hkHolidayName('2026-04-05')).toBeUndefined()
    expect(hkHolidayName('2026-04-06')).toBe('The day following Ching Ming Festival')
    expect(hkHolidayName('2026-04-07')).toBe('The day following Easter Monday')
  })

  it('crosses the year boundary', () => {
    expect(hkHolidayName('2026-12-25')).toBe('Christmas Day')
    expect(hkHolidayName('2027-01-01')).toBe('The first day of January')
  })

  it('is empty rather than wrong outside the bundled years', () => {
    expect(hkHolidayName(`${HK_HOLIDAY_YEARS.last + 1}-01-01`)).toBeUndefined()
    expect(hkHolidayName('not-a-date')).toBeUndefined()
  })

  it('bundles every key as a sortable local date string', () => {
    const keys = Object.keys(HK_HOLIDAYS)
    expect(keys.length).toBeGreaterThan(30)
    for (const k of keys) expect(k).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect([...keys].sort()).toEqual(keys)
  })
})
