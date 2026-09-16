import { describe, expect, it } from 'vitest'
import { SCHEMA_VERSION } from '../types'
import { defaultAppData, defaultSettings, runMigrations } from './migrations'

describe('runMigrations', () => {
  it('passes v1 data through, filling defaults for missing fields', () => {
    const out = runMigrations({ tasks: [], settings: { theme: 'dark' } }, 1)
    expect(out.settings.theme).toBe('dark')
    expect(out.settings.weather).toEqual(defaultSettings().weather)
    expect(out.notes).toEqual([])
    expect(out.lastChangeAt).toBeNull()
  })

  it('backfills the bookmark collections when migrating v2 data', () => {
    const out = runMigrations({ tasks: [], settings: defaultSettings() }, 2)
    expect(out.bookmarks).toEqual([])
    expect(out.bookmarkGroups).toEqual([])
  })

  it('moves v3 data onto a Sunday week start', () => {
    const out = runMigrations({ settings: { ...defaultSettings(), weekStartsOn: 1 } }, 3)
    expect(out.settings.weekStartsOn).toBe(0)
  })

  it('returns complete data for empty input', () => {
    expect(runMigrations({}, 1)).toEqual(defaultAppData())
  })

  it('refuses data newer than the app', () => {
    expect(() => runMigrations({}, SCHEMA_VERSION + 1)).toThrow(/only knows/)
  })

  it('has a registered step for every version below SCHEMA_VERSION', () => {
    // Guard: bumping SCHEMA_VERSION without adding its migration step makes
    // this loop hit the "Missing migration step" throw and fail the suite.
    for (let v = 1; v < SCHEMA_VERSION; v++) {
      expect(() => runMigrations(defaultAppData(), v)).not.toThrow()
    }
    expect(runMigrations(defaultAppData(), SCHEMA_VERSION)).toEqual(defaultAppData())
  })
})
