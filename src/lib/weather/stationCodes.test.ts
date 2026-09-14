import { describe, expect, it } from 'vitest'
import { deriveInitials, shortLabel } from './stationCodes'

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
