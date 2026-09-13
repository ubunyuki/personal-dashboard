import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Download, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { deleteScene } from '../../lib/storage/idb'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import { iconBtnCls } from '../statusbar/QuickActions'
import type { WhiteboardHandle } from './ExcalidrawCanvas'

type CanvasModule = typeof import('./ExcalidrawCanvas')

function ImportFailed() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        The app was updated while this tab was open — the whiteboard module needs a fresh load.
      </p>
      <Button variant="primary" onClick={() => location.reload()}>
        Reload app
      </Button>
    </div>
  )
}

// The whole Excalidraw bundle (and its CSS) rides this lazy chunk; a failed
// import after a deploy resolves to the reload screen instead of crashing.
const ExcalidrawCanvas = lazy(() =>
  import('./ExcalidrawCanvas').catch(
    (): CanvasModule => ({ default: ImportFailed as unknown as CanvasModule['default'] }),
  ),
)

const exportBtnCls =
  'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'

export function WhiteboardOverlay() {
  const open = useUiStore((s) => s.whiteboardOpen)
  if (!open) return null
  return <WhiteboardShell />
}

function WhiteboardShell() {
  const close = useUiStore((s) => s.closeWhiteboard)
  const boards = useAppStore((s) => s.boards)
  const addBoard = useAppStore((s) => s.addBoard)
  const renameBoard = useAppStore((s) => s.renameBoard)
  const deleteBoard = useAppStore((s) => s.deleteBoard)
  const canvasRef = useRef<WhiteboardHandle>(null)
  const sorted = useMemo(
    () => [...boards].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [boards],
  )
  const [boardId, setBoardId] = useState<string | null>(sorted[0]?.id ?? null)
  const board = boards.find((b) => b.id === boardId)

  useEffect(() => {
    // Read live store state: StrictMode re-runs this setup with a stale
    // closure, which would otherwise create the default board twice.
    const current = useAppStore.getState().boards
    if (current.length === 0) {
      const b = addBoard('Board 1')
      setBoardId(b.id)
      return
    }
    if (!boardId || !current.some((b) => b.id === boardId)) {
      setBoardId([...current].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0].id)
    }
  }, [boards, boardId, addBoard])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Excalidraw preventDefaults the Escapes it consumes (deselect etc.).
      if (e.key === 'Escape' && !e.defaultPrevented) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  const createBoard = () => {
    const name = window.prompt('Board name', `Board ${boards.length + 1}`)
    if (name === null) return
    const b = addBoard(name)
    setBoardId(b.id)
  }

  const rename = () => {
    if (!board) return
    const name = window.prompt('Rename board', board.name)
    if (name === null || !name.trim()) return
    renameBoard(board.id, name)
  }

  const remove = () => {
    if (!board) return
    if (!window.confirm(`Delete board “${board.name}” and its drawing?`)) return
    deleteBoard(board.id)
    void deleteScene(board.id)
    setBoardId(null) // the effect selects the next board or creates a fresh one
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex h-11 shrink-0 items-center gap-1.5 border-b border-slate-200 bg-white px-2 dark:border-slate-800 dark:bg-slate-900">
        <button type="button" title="Close whiteboard" onClick={close} className={iconBtnCls}>
          <X size={16} strokeWidth={1.75} />
        </button>
        <span className="text-sm font-semibold tracking-tight select-none">Whiteboard</span>
        <select
          title="Switch board"
          value={boardId ?? ''}
          onChange={(e) => setBoardId(e.target.value)}
          className="ml-1 max-w-48 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          {sorted.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <button type="button" title="New board" onClick={createBoard} className={iconBtnCls}>
          <Plus size={15} strokeWidth={1.75} />
        </button>
        <button type="button" title="Rename board" onClick={rename} className={iconBtnCls}>
          <Pencil size={14} strokeWidth={1.75} />
        </button>
        <button type="button" title="Delete board" onClick={remove} className={iconBtnCls}>
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            title="Download as PNG"
            onClick={() => void canvasRef.current?.exportImage('png', board?.name ?? 'board')}
            className={exportBtnCls}
          >
            <Download size={13} /> PNG
          </button>
          <button
            type="button"
            title="Download as SVG"
            onClick={() => void canvasRef.current?.exportImage('svg', board?.name ?? 'board')}
            className={exportBtnCls}
          >
            <Download size={13} /> SVG
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Loading whiteboard…
            </div>
          }
        >
          {boardId && <ExcalidrawCanvas key={boardId} ref={canvasRef} boardId={boardId} />}
        </Suspense>
      </div>
    </div>
  )
}
