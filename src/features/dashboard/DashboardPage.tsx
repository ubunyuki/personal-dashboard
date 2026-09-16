import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Eye, EyeOff, LayoutGrid } from 'lucide-react'
import { tintedIconBtnCls as iconBtn } from '../../components/ui/swatches'
import { reconcileLayout } from '../../lib/dashboard/layout'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import { TILE_REGISTRY } from './tiles'

export function DashboardPage() {
  const tasksCount = useAppStore((s) => s.tasks.length)
  const notesCount = useAppStore((s) => s.notes.length)
  const stored = useAppStore((s) => s.dashboardLayout)
  const moveTile = useAppStore((s) => s.moveDashboardTile)
  const toggleTile = useAppStore((s) => s.toggleDashboardTile)
  const openRestorePrompt = useUiStore((s) => s.openRestorePrompt)
  // Edit mode is a view state, not a preference: reloading should never leave
  // the dashboard sitting in its editor.
  const [editing, setEditing] = useState(false)
  const layout = useMemo(() => reconcileLayout(stored), [stored])
  // Hidden tiles are listed while editing — otherwise unhiding one would be
  // impossible from here.
  const shown = editing ? layout : layout.filter((t) => t.visible)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/10"
        >
          <LayoutGrid size={13} />
          {editing ? 'Done' : 'Edit layout'}
        </button>
      </div>
      {tasksCount === 0 && notesCount === 0 && (
        <button
          type="button"
          onClick={() => openRestorePrompt('import')}
          className="self-start rounded-md px-1 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
        >
          New machine or cleared browser? Restore from a backup file →
        </button>
      )}
      {/* One grid for every tile: `span` decides how many columns each claims,
          so hiding or reordering a tile lets the rest close up rather than
          leaving a half-width hole. */}
      <div className="grid gap-3 md:grid-cols-2">
        {shown.map((tile, i) => {
          const def = TILE_REGISTRY[tile.id]
          const Tile = def.Component
          return (
            <div
              key={tile.id}
              className={`tile-slot ${def.span === 'full' ? 'md:col-span-2' : ''}`}
            >
              {editing && (
                <div className="mb-1 flex items-center gap-0.5">
                  <span className="mr-auto text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                    {def.label}
                  </span>
                  <button
                    type="button"
                    title="Move tile up"
                    className={iconBtn}
                    disabled={i === 0}
                    onClick={() => moveTile(tile.id, -1)}
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    title="Move tile down"
                    className={iconBtn}
                    disabled={i === shown.length - 1}
                    onClick={() => moveTile(tile.id, 1)}
                  >
                    <ChevronDown size={13} />
                  </button>
                  <button
                    type="button"
                    title={tile.visible ? 'Hide tile' : 'Show tile'}
                    className={iconBtn}
                    onClick={() => toggleTile(tile.id)}
                  >
                    {tile.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                </div>
              )}
              {tile.visible ? (
                <Tile />
              ) : (
                // A placeholder rather than the dimmed tile itself: several
                // tiles render nothing when they have no content, which would
                // make "hidden" and "empty" look identical.
                <div className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
                  Hidden
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
