import { describe, expect, it } from 'vitest'
import { persistedSlice, useAppStore } from './appStore'
import { defaultAppData } from './migrations'
import { requiredArraysFor } from '../lib/backup/envelope'
import { SCHEMA_VERSION } from '../types'

/**
 * Drift guards for the three hand-maintained descriptions of persisted data:
 * defaultAppData() (the canonical shape — runMigrations spreads it under
 * everything), persistedSlice (localStorage AND backup envelopes), and
 * requiredArraysFor (envelope validation).
 */
describe('persistedSlice', () => {
  it('produces exactly the keys of defaultAppData — localStorage and backups cannot drift', () => {
    const sliceKeys = Object.keys(persistedSlice(useAppStore.getState())).sort()
    expect(sliceKeys).toEqual(Object.keys(defaultAppData()).sort())
  })
})

describe('requiredArraysFor', () => {
  const arrayKeys = Object.entries(defaultAppData())
    .filter(([, v]) => Array.isArray(v))
    .map(([k]) => k)

  it('only requires collections defaultAppData actually has', () => {
    // Subset, not equality: a collection added WITHOUT a schema bump must
    // stay out of the required list for its version, or older backups
    // written at that same version would stop validating.
    for (let v = 1; v <= SCHEMA_VERSION; v++) {
      for (const key of requiredArraysFor(v)) expect(arrayKeys).toContain(key)
    }
  })

  it('never shrinks as versions advance', () => {
    for (let v = 1; v < SCHEMA_VERSION; v++) {
      const next = requiredArraysFor(v + 1)
      for (const key of requiredArraysFor(v)) expect(next).toContain(key)
    }
  })
})
