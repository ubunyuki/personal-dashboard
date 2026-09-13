import { describe, expect, it } from 'vitest'
import { buildMonthGrid, dueBucketOf } from './dates'

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
    const grid = buildMonthGrid(2026, 8) // September 2026
    expect(grid).toHaveLength(42)
    expect(grid[0].date).toBe('2026-08-31') // Monday before Tue 1 Sep
    expect(new Date(2026, 7, 31).getDay()).toBe(1)
    for (let i = 1; i < grid.length; i++) {
      expect(grid[i].date > grid[i - 1].date).toBe(true)
    }
  })

  it('crosses the year boundary correctly', () => {
    const grid = buildMonthGrid(2027, 0) // January 2027 starts on a Friday
    expect(grid[0].date).toBe('2026-12-28')
    expect(grid[0].inMonth).toBe(false)
    expect(grid.find((c) => c.date === '2027-01-01')?.inMonth).toBe(true)
    expect(grid[41].date).toBe('2027-02-07')
  })

  it('marks out-of-month cells', () => {
    const grid = buildMonthGrid(2026, 8)
    expect(grid.filter((c) => c.inMonth)).toHaveLength(30)
  })
})
