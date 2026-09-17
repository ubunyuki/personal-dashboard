import { describe, expect, it } from 'vitest'
import { deriveInitials, shortLabel, stationLabel } from './stationCodes'

describe('shortLabel', () => {
  it('uses the curated code when one exists', () => {
    expect(shortLabel('Hong Kong Observatory')).toBe('HKO')
    expect(shortLabel('Sha Tin')).toBe('ST')
  })

  it('falls back to derived initials for unmapped places', () => {
    expect(shortLabel('Wong Tai Sin')).toBe('WTS')
    expect(shortLabel('London')).toBe('LON')
  })
})

describe('deriveInitials', () => {
  it('takes the first letters of up to three words', () => {
    expect(deriveInitials('Tseung Kwan O')).toBe('TKO')
    expect(deriveInitials('Tai Mo Shan Extra Words')).toBe('TMS')
  })

  it('takes the first three letters of a single word', () => {
    expect(deriveInitials('Stanley')).toBe('STA')
  })

  it('handles blank input', () => {
    expect(deriveInitials('   ')).toBe('')
  })
})

describe('stationLabel', () => {
  it('reads Chinese by default and English when asked', () => {
    expect(stationLabel('Sha Tin', 'tc')).toBe('沙田')
    expect(stationLabel('Sha Tin', undefined)).toBe('沙田')
    expect(stationLabel('Sha Tin', 'name')).toBe('Sha Tin')
    expect(stationLabel('Sha Tin', 'code')).toBe('ST')
  })

  it('keeps the English name for a place the table does not know', () => {
    // Open-Meteo cities, and any station HKO adds after stationNames.ts was
    // generated — a blank chip would be worse than an English one.
    expect(stationLabel('Reykjavík', 'tc')).toBe('Reykjavík')
  })
})
