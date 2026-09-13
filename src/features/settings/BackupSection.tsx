import { useEffect, useState } from 'react'
import { FileDown, FileUp, FolderOpen } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useNow } from '../../lib/useNow'
import { formatAge } from '../../lib/dates/dates'
import { clearDirHandle, loadDirHandle } from '../../lib/storage/idb'
import { maybeBackup, refreshBackupStatus } from '../../lib/backup/autoBackup'
import { exportBackupFile } from '../../lib/backup/exportImport'
import { fsAccessSupported, pickBackupFolder } from '../../lib/backup/fsAccess'
import { useUiStore } from '../../store/uiStore'

export function BackupSection() {
  const backup = useUiStore((s) => s.backup)
  const openRestorePrompt = useUiStore((s) => s.openRestorePrompt)
  const now = useNow(60_000)
  const [folderName, setFolderName] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    void loadDirHandle().then((h) => setFolderName(h?.name ?? null))
  }, [backup.mode])

  const chooseFolder = async () => {
    setNotice('')
    try {
      const handle = await pickBackupFolder()
      if (!handle) return // cancelled
      setFolderName(handle.name)
      const result = await maybeBackup('manual')
      setNotice(result === 'written' ? 'Folder saved — first snapshot written.' : 'Folder saved.')
    } catch {
      // SecurityError → the API is blocked (likely corporate policy)
      setNotice('Edge blocked folder access on this machine — use Export/Restore files instead.')
      await refreshBackupStatus()
    }
  }

  const backupNow = async () => {
    setNotice('')
    const result = await maybeBackup('manual')
    setNotice(
      result === 'written'
        ? 'Snapshot written.'
        : result === 'needs-permission'
          ? 'Edge did not grant folder access.'
          : result === 'error'
            ? 'Backup failed (folder locked or removed?) — will retry automatically.'
            : '',
    )
  }

  const stopAuto = async () => {
    await clearDirHandle()
    setFolderName(null)
    await refreshBackupStatus()
  }

  const exportFile = async () => {
    await exportBackupFile()
    await refreshBackupStatus()
    setNotice('Backup file downloaded.')
  }

  const age = backup.lastBackupAt ? formatAge(backup.lastBackupAt, now) : 'never'
  const status =
    backup.mode === 'blocked'
      ? 'Automatic folder backups are unavailable here (unsupported or blocked by policy). Export a file regularly instead — weekly keeps you safe.'
      : backup.mode === 'unconfigured'
        ? 'No backup folder chosen yet. Pick one inside OneDrive so snapshots leave this machine.'
        : backup.mode === 'permission-needed'
          ? `Folder “${folderName ?? '…'}” needs one click to re-allow access.`
          : backup.mode === 'error'
            ? `Folder “${folderName ?? '…'}” — the last attempt failed (locked file?). It will retry automatically.`
            : `Auto-backup on — folder “${folderName ?? '…'}”. Writes at most hourly when data changed, keeps the newest 30 snapshots.`

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        {status}
        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
          Last backup: {age}
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {fsAccessSupported() && backup.mode === 'unconfigured' && (
          <Button variant="primary" onClick={() => void chooseFolder()}>
            <span className="flex items-center gap-1.5">
              <FolderOpen size={14} /> Choose backup folder…
            </span>
          </Button>
        )}
        {(backup.mode === 'auto' ||
          backup.mode === 'permission-needed' ||
          backup.mode === 'error') && (
          <>
            <Button variant="primary" onClick={() => void backupNow()}>
              {backup.mode === 'permission-needed' ? 'Allow & back up now' : 'Back up now'}
            </Button>
            <Button onClick={() => void chooseFolder()}>Change folder…</Button>
            <Button onClick={() => void stopAuto()}>Turn off</Button>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
        <Button onClick={() => void exportFile()}>
          <span className="flex items-center gap-1.5">
            <FileDown size={14} /> Export backup file
          </span>
        </Button>
        <Button onClick={() => openRestorePrompt('import')}>
          <span className="flex items-center gap-1.5">
            <FileUp size={14} /> Restore…
          </span>
        </Button>
      </div>
      {notice && <p className="text-xs text-slate-500 dark:text-slate-400">{notice}</p>}
    </div>
  )
}
