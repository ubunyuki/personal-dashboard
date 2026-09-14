import { describe, expect, it } from 'vitest'
import { fuzzyMatch } from './match'

describe('fuzzyMatch', () => {
  it('rejects non-subsequences and empty queries', () => {
    expect(fuzzyMatch('xyz', 'weekly report')).toBeNull()
    expect(fuzzyMatch('', 'anything')).toBeNull()
    expect(fuzzyMatch('long query', 'log')).toBeNull()
  })

  it('is case-insensitive', () => {
    expect(fuzzyMatch('REP', 'weekly report')).not.toBeNull()
  })

  it('ranks substring hits above scattered subsequences', () => {
    const tight = fuzzyMatch('rep', 'report')!
    const scattered = fuzzyMatch('rep', 'r e p something')!
    expect(tight.score).toBeGreaterThan(scattered.score)
  })

  it('ranks word-boundary starts above mid-word hits', () => {
    const boundary = fuzzyMatch('rev', 'site revamp')!
    const midWord = fuzzyMatch('rev', 'irreverent')!
    expect(boundary.score).toBeGreaterThan(midWord.score)
  })

  it('prefers the shorter of two equal-quality haystacks', () => {
    const short = fuzzyMatch('spec', 'spec')!
    const long = fuzzyMatch('spec', 'spec for the new landing page')!
    expect(short.score).toBeGreaterThan(long.score)
  })

  it('returns merged half-open ranges over the original text', () => {
    expect(fuzzyMatch('rep', 'weekly report')!.ranges).toEqual([[7, 10]])
    // Scattered: one range per island.
    const m = fuzzyMatch('wr', 'weekly report')!
    expect(m.ranges).toEqual([
      [0, 1],
      [7, 8],
    ])
  })
})
