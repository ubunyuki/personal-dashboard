import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
} from 'react'
import { Excalidraw, exportToBlob, exportToSvg, getSceneVersion } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { format } from 'date-fns'
import type { StoredScene } from '../../types'
import { loadScene, saveScene } from '../../lib/storage/idb'
import { useAppStore } from '../../store/appStore'

type ExcalidrawProps = ComponentProps<typeof Excalidraw>
type ExcalidrawAPI = Parameters<NonNullable<ExcalidrawProps['excalidrawAPI']>>[0]
type OnChange = NonNullable<ExcalidrawProps['onChange']>
interface CapturedScene {
  elements: Parameters<OnChange>[0]
  appState: Parameters<OnChange>[1]
  files: Parameters<OnChange>[2]
}

export interface WhiteboardHandle {
  exportImage: (kind: 'png' | 'svg', boardName: string) => Promise<void>
}

const emptyScene = (): StoredScene => ({ elements: [], appState: {}, files: {} })

function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[^\w\- ]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
  return cleaned || 'board'
}

function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

const ExcalidrawCanvas = forwardRef<WhiteboardHandle, { boardId: string }>(
  function ExcalidrawCanvas({ boardId }, ref) {
    const [initial, setInitial] = useState<StoredScene | null>(null)
    const apiRef = useRef<ExcalidrawAPI | null>(null)
    // Last scene seen via onChange. Persisting from this snapshot (never by
    // querying the api) keeps the unmount flush safe: a torn-down Excalidraw
    // reports an empty scene, which must not clobber the stored drawing.
    const captured = useRef<CapturedScene | null>(null)
    const lastSaved = useRef(-1)
    const timer = useRef<number | undefined>(undefined)

    useEffect(() => {
      let alive = true
      void loadScene(boardId).then((s) => {
        if (alive) setInitial(s ?? emptyScene())
      })
      return () => {
        alive = false
      }
    }, [boardId])

    // Debounced autosave, gated on getSceneVersion so pointer-move noise and
    // StrictMode double-mounts never write.
    const persist = () => {
      const snap = captured.current
      if (!snap) return
      const version = getSceneVersion(snap.elements)
      if (version === lastSaved.current) return
      // An entirely empty scene only occurs mid-initialization or after
      // teardown — deleting elements by hand soft-deletes them (version > 0).
      if (version === 0 && lastSaved.current > 0) return
      lastSaved.current = version
      const scene: StoredScene = {
        elements: snap.elements as unknown as StoredScene['elements'],
        // Allowlist only — the full appState holds a Map (collaborators)
        // that breaks JSON round-trips.
        appState: {
          viewBackgroundColor: snap.appState.viewBackgroundColor,
          scrollX: snap.appState.scrollX,
          scrollY: snap.appState.scrollY,
          zoom: snap.appState.zoom,
        },
        files: snap.files as unknown as StoredScene['files'],
      }
      void saveScene(boardId, scene)
      useAppStore.getState().touchBoard(boardId)
    }
    const persistRef = useRef(persist)
    persistRef.current = persist

    useEffect(() => {
      const flush = () => persistRef.current()
      window.addEventListener('beforeunload', flush)
      return () => {
        window.clearTimeout(timer.current)
        window.removeEventListener('beforeunload', flush)
        flush() // board switch or overlay close — reads the captured snapshot
      }
    }, [])

    useImperativeHandle(ref, () => ({
      exportImage: async (kind, boardName) => {
        const api = apiRef.current
        if (!api) return
        const elements = api.getSceneElements()
        const appState = api.getAppState()
        const files = api.getFiles()
        const name = `${sanitizeFileName(boardName)}-${format(new Date(), 'yyyy-MM-dd')}.${kind}`
        if (kind === 'png') {
          const blob = await exportToBlob({
            elements,
            appState: { ...appState, exportBackground: true },
            files,
            mimeType: 'image/png',
          } as Parameters<typeof exportToBlob>[0])
          downloadBlob(blob, name)
        } else {
          const svg = await exportToSvg({
            elements,
            appState,
            files,
          } as Parameters<typeof exportToSvg>[0])
          downloadBlob(new Blob([svg.outerHTML], { type: 'image/svg+xml' }), name)
        }
      },
    }))

    if (initial === null) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-slate-400">
          Loading board…
        </div>
      )
    }

    const dark = document.documentElement.classList.contains('dark')

    return (
      <Excalidraw
        excalidrawAPI={(api) => {
          apiRef.current = api
          lastSaved.current = getSceneVersion(api.getSceneElements())
        }}
        initialData={
          {
            elements: initial.elements,
            appState: initial.appState,
            files: initial.files,
          } as ExcalidrawProps['initialData']
        }
        onChange={(elements, appState, files) => {
          captured.current = { elements, appState, files }
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => persistRef.current(), 500)
        }}
        theme={dark ? 'dark' : 'light'}
      />
    )
  },
)

export default ExcalidrawCanvas
