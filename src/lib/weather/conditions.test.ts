import { describe, expect, it } from 'vitest'
import { hkoIconToCondition, wmoToCondition } from './conditions'

describe('wmoToCondition', () => {
  it('maps clear sky by day/night', () => {
    expect(wmoToCondition(0, true).icon).toBe('sun')
    expect(wmoToCondition(0, false).icon).toBe('moon')
  })
  it('maps the main families', () => {
    expect(wmoToCondition(2, true).icon).toBe('partly')
    expect(wmoToCondition(3, true).icon).toBe('cloud')
    expect(wmoToCondition(45, true).icon).toBe('fog')
    expect(wmoToCondition(55, true).icon).toBe('drizzle')
    expect(wmoToCondition(63, true).icon).toBe('rain')
    expect(wmoToCondition(75, true).icon).toBe('snow')
    expect(wmoToCondition(81, true).label).toBe('Showers')
    expect(wmoToCondition(95, true).icon).toBe('thunder')
  })
  it('falls back on unknown codes', () => {
    expect(wmoToCondition(42, true).icon).toBe('cloud')
  })
})

describe('hkoIconToCondition', () => {
  it('maps common HKO codes', () => {
    expect(hkoIconToCondition(50).icon).toBe('sun')
    expect(hkoIconToCondition(51).icon).toBe('partly')
    expect(hkoIconToCondition(63).icon).toBe('rain')
    expect(hkoIconToCondition(65).icon).toBe('thunder')
    expect(hkoIconToCondition(83).icon).toBe('fog')
    expect(hkoIconToCondition(72).icon).toBe('moon')
  })
  it('falls back on unknown or missing codes', () => {
    expect(hkoIconToCondition(undefined).icon).toBe('cloud')
    expect(hkoIconToCondition(999).icon).toBe('cloud')
  })
})
