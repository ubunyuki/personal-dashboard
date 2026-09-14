import { useRef, useState } from 'react'
import { FileUp, FolderOpen, RotateCcw } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import type { BackupEnvelope } from '../../types'
import { loadDirHandle } from '../../lib/storage/idb'
import { listSnapshots, readSnapshot, requestPerm } from '../../lib/backup/fsAccess'
import { readEnvelopeFile, restoreEnvelope } from '../../lib/backup/exportImport'
import { summarizeEnvelope } from '../../lib/backup/envelope'
import { writeBackupMeta } from '../../lib/backup/meta'
import { useUiStore } from '../../store/uiStore'

export function RestorePrompt() {
  const kind = useUiStore((s) => s.restorePrompt)
  const close = useUiStore((s) => s.closeRestorePrompt)
  const [snapshots, setSnapshots] = useState<string[] | null>(null)
  const [env, setEnv] = useState<BackupEnvelope | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const handleRef = useRef<FileSystemDirectoryHandle | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!kind) return null
  const tripwire = kind === 'tripwire'

  const dismiss = () => {
    // Re-arm the marker so the tripwire doesn't refire every boot.
    if (tripwire) writeBackupMeta({})
    close()
  }

  const browseFolder = async () => {
    setError('')
    setBusy(true)
    try {
      const handle = await loadDirHandle()
      if (!handle) {
        setError('No backup folder is remembered in this browser — use “Import backup file”.')
        return
      }
      const perm = await requestPerm(handle)
      if (perm !== 'granted') {
        setError('Folder access was not granted — use “Import backup file” instead.')
        return
      }
      handleRef.current = handle
      setSnapshots(await listSnapshots(handle))
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e))
    } finally {
      setBusy(false)
    }
  }

  const pickSnapshot = async (name: string) => {
    setError('')
    setBusy(true)
    try {
      const file = await readSnapshot(handleRef.current!, name)
      setEnv(await readEnvelopeFile(file))
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e))
    } finally {
      setBusy(false)
    }
  }

  const onFile = async (file: File) => {
    setError('')
    try {
      setEnv(await readEnvelopeFile(file))
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e))
    }
  }

  const summary = env ? summarizeEnvelope(env) : null

  return (
    <Modal title={tripwire ? 'Browser storage was cleared' : 'Restore from backup'} onClose={dismiss}>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void onFile(f)
          e.target.value = ''
        }}
      />
      {env && summary ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            This backup{summary.exportedAt ? ` from ${new Date(summary.exportedAt).toLocaleString()}` : ''} contains:
          </p>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm tabular-nums dark:bg-slate-800">
            Tasks: {summary.tasks} · Notes: {summary.notes} · Events: {summary.events} · Boards:{' '}
            {summary.boards} · Bookmarks: {summary.bookmarks}
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            Restoring replaces everything currently in the app.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={() => void restoreEnvelope(env)}>
              <span className="flex items-center gap-1.5">
                <RotateCcw size={14} /> Restore
              </span>
            </Button>
            <Button onClick={() => setEnv(null)}>Back</Button>
          </div>
        </div>
      ) : snapshots ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm">Snapshots in your backup folder (newest first):</p>
          {snapshots.length === 0 ? (
            <p className="text-sm text-slate-500">No snapshot files found in that folder.</p>
          ) : (
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {snapshots.map((name) => (
                <button
                  key={name}
                  type="button"
                  disabled={busy}
                  onClick={() => void pickSnapshot(name)}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-left font-mono text-xs hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-950"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
          <Button onClick={() => setSnapshots(null)}>Back</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tripwire && (
            <p className="text-sm">
              A backup folder is remembered for this app, but the browser's site data (your tasks
              and notes) is gone — most likely cleared by a policy or a manual “clear browsing
              data”. You can restore from your latest snapshot.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" disabled={busy} onClick={() => void browseFolder()}>
              <span className="flex items-center gap-1.5">
                <FolderOpen size={14} /> Browse backup folder
              </span>
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <span className="flex items-center gap-1.5">
                <FileUp size={14} /> Import backup file
              </span>
            </Button>
            {tripwire && (
              <Button className="ml-auto" onClick={dismiss}>
                Start fresh
              </Button>
            )}
          </div>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </Modal>
  )
}
