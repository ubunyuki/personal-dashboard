import { describe, expect, it } from 'vitest'
import { parseTimeInput } from './timeInput'

describe('parseTimeInput', () => {
  it('reads bare digits as a 24-hour time', () => {
    expect(parseTimeInput('1430')).toBe('14:30')
    expect(parseTimeInput('0930')).toBe('09:30')
    // Three digits can only split one way that leaves valid minutes.
    expect(parseTimeInput('930')).toBe('09:30')
    expect(parseTimeInput('9')).toBe('09:00')
    expect(parseTimeInput('14')).toBe('14:00')
    expect(parseTimeInput('0000')).toBe('00:00')
  })

  it('accepts the usual separators', () => {
    expect(parseTimeInput('14:30')).toBe('14:30')
    expect(parseTimeInput('14.30')).toBe('14:30')
    expect(parseTimeInput('14h30')).toBe('14:30')
    expect(parseTimeInput(' 14 : 30 ')).toBe('14:30')
  })

  it('converts a 12-hour time, wrapping noon and midnight correctly', () => {
    expect(parseTimeInput('2:30pm')).toBe('14:30')
    expect(parseTimeInput('2.30PM')).toBe('14:30')
    expect(parseTimeInput('230pm')).toBe('14:30')
    expect(parseTimeInput('9am')).toBe('09:00')
    expect(parseTimeInput('12am')).toBe('00:00')
    expect(parseTimeInput('12pm')).toBe('12:00')
    expect(parseTimeInput('11:59p.m.')).toBe('23:59')
  })

  it('is idempotent, so a form can normalise again on submit', () => {
    expect(parseTimeInput(parseTimeInput('1430') ?? '')).toBe('14:30')
  })

  it('rejects anything that is not a real time', () => {
    expect(parseTimeInput('')).toBeNull()
    expect(parseTimeInput('   ')).toBeNull()
    expect(parseTimeInput('abc')).toBeNull()
    expect(parseTimeInput('2500')).toBeNull()
    expect(parseTimeInput('14:60')).toBeNull()
    expect(parseTimeInput('13pm')).toBeNull()
    expect(parseTimeInput('0pm')).toBeNull()
    expect(parseTimeInput('12:30:45')).toBeNull()
  })
})
