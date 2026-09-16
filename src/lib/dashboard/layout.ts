import type { DashboardTile, TileId } from '../../types'

/**
 * The dashboard's tile order and visibility. Stored data is only ever a HINT:
 * it can name a tile this build has never heard of (written by a newer
 * version, or hand-edited), and it can be missing a tile this build ships.
 * reconcileLayout is what turns that hint into something renderable, and
 * every read of dashboardLayout goes through it.
 *
 * The tile COMPONENTS live in features/dashboard/tiles.tsx — this module is
 * deliberately component-free so store/migrations.ts can seed the default
 * layout without reaching into features.
 */

/** Canonical order, and the set of ids this build knows. Adding a tile is a
 *  one-line change here plus its registry entry: reconcileLayout appends it
 *  to every saved layout, so nobody is stranded on a stale one. */
export const TILE_ORDER: readonly TileId[] = [
  'metrics',
  'pinnedNotes',
  'buckets',
  'events',
  'notes',
  'bookmarks',
]

export function defaultLayout(): DashboardTile[] {
  return TILE_ORDER.map((id) => ({ id, visible: true }))
}

/**
 * Stored layout → the layout actually rendered:
 * - ids this build does not know are dropped;
 * - a repeated id keeps only its first entry, so a tile can never render twice;
 * - tiles the build knows but the layout lacks are appended, visible.
 *
 * Appending rather than rebuilding is the point: a user who reordered their
 * dashboard in an older version keeps that order and simply gains the new
 * tile at the end.
 */
export function reconcileLayout(stored: DashboardTile[] | undefined): DashboardTile[] {
  const known = new Set<string>(TILE_ORDER)
  const seen = new Set<string>()
  const out: DashboardTile[] = []
  for (const tile of stored ?? []) {
    const id = (tile as Partial<DashboardTile> | null)?.id
    if (typeof id !== 'string' || !known.has(id) || seen.has(id)) continue
    seen.add(id)
    // Anything but an explicit false is visible — an absent flag is a tile
    // the user never hid.
    out.push({ id: id as TileId, visible: tile.visible !== false })
  }
  for (const id of TILE_ORDER) if (!seen.has(id)) out.push({ id, visible: true })
  return out
}

/** Swap a tile with its neighbour. Returns the input unchanged at the ends
 *  and for an unknown id, which is how the store action skips the write. */
export function moveTileIn(
  layout: DashboardTile[],
  id: TileId,
  delta: -1 | 1,
): DashboardTile[] {
  const i = layout.findIndex((t) => t.id === id)
  const j = i + delta
  if (i < 0 || j < 0 || j >= layout.length) return layout
  const next = [...layout]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

/** Hidden tiles keep their position, so unhiding puts them back where they
 *  were rather than at the end. */
export function toggleTileIn(layout: DashboardTile[], id: TileId): DashboardTile[] {
  if (!layout.some((t) => t.id === id)) return layout
  return layout.map((t) => (t.id === id ? { ...t, visible: !t.visible } : t))
}
