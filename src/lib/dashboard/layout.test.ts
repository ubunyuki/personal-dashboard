import { describe, expect, it } from 'vitest'
import type { DashboardTile } from '../../types'
import { TILE_ORDER, defaultLayout, moveTileIn, reconcileLayout, toggleTileIn } from './layout'

const ids = (layout: DashboardTile[]) => layout.map((t) => t.id)

describe('defaultLayout', () => {
  it('is every known tile, in canonical order, all visible', () => {
    expect(ids(defaultLayout())).toEqual([...TILE_ORDER])
    expect(defaultLayout().every((t) => t.visible)).toBe(true)
  })
})

describe('reconcileLayout', () => {
  it('falls back to the default layout for missing data', () => {
    expect(reconcileLayout(undefined)).toEqual(defaultLayout())
    expect(reconcileLayout([])).toEqual(defaultLayout())
  })

  it('keeps a custom order and appends tiles the stored layout never heard of', () => {
    // What a user upgrading from a build with only three tiles has saved.
    const stale = [
      { id: 'notes', visible: true },
      { id: 'metrics', visible: false },
      { id: 'events', visible: true },
    ] as DashboardTile[]
    const out = reconcileLayout(stale)
    expect(ids(out).slice(0, 3)).toEqual(['notes', 'metrics', 'events'])
    expect(ids(out)).toHaveLength(TILE_ORDER.length)
    // Their hidden tile stays hidden; the newcomers arrive visible.
    expect(out.find((t) => t.id === 'metrics')?.visible).toBe(false)
    expect(out.slice(3).every((t) => t.visible)).toBe(true)
  })

  it('drops ids this build does not know', () => {
    const out = reconcileLayout([
      { id: 'weather-radar', visible: true },
      { id: 'notes', visible: true },
    ] as unknown as DashboardTile[])
    expect(ids(out)[0]).toBe('notes')
    expect(ids(out)).not.toContain('weather-radar')
  })

  it('renders a repeated id once, keeping its first entry', () => {
    const out = reconcileLayout([
      { id: 'notes', visible: false },
      { id: 'notes', visible: true },
    ] as DashboardTile[])
    expect(ids(out).filter((id) => id === 'notes')).toEqual(['notes'])
    expect(out[0].visible).toBe(false)
  })

  it('treats an absent visible flag as visible', () => {
    const out = reconcileLayout([{ id: 'notes' }] as unknown as DashboardTile[])
    expect(out[0]).toEqual({ id: 'notes', visible: true })
  })
})

describe('moveTileIn', () => {
  it('swaps with the neighbour', () => {
    const out = moveTileIn(defaultLayout(), 'buckets', -1)
    expect(ids(out).slice(0, 3)).toEqual(['metrics', 'buckets', 'pinnedNotes'])
  })

  it('no-ops at both ends and for an unknown id (same reference back)', () => {
    const layout = defaultLayout()
    expect(moveTileIn(layout, TILE_ORDER[0], -1)).toBe(layout)
    expect(moveTileIn(layout, TILE_ORDER[TILE_ORDER.length - 1], 1)).toBe(layout)
    const empty: DashboardTile[] = []
    expect(moveTileIn(empty, 'notes', 1)).toBe(empty)
  })
})

describe('toggleTileIn', () => {
  it('flips visibility without moving the tile', () => {
    const out = toggleTileIn(defaultLayout(), 'notes')
    expect(ids(out)).toEqual([...TILE_ORDER])
    expect(out.find((t) => t.id === 'notes')?.visible).toBe(false)
    expect(toggleTileIn(out, 'notes').find((t) => t.id === 'notes')?.visible).toBe(true)
  })

  it('no-ops for an id the layout does not hold (same reference back)', () => {
    const layout = [{ id: 'notes', visible: true }] as DashboardTile[]
    expect(toggleTileIn(layout, 'metrics')).toBe(layout)
  })
})
