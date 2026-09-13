import { useNow } from '../../lib/useNow'
import { formatAge } from '../../lib/dates/dates'
import { maybeBackup } from '../../lib/backup/autoBackup'
import { useUiStore, type BackupMode } from '../../store/uiStore'

const FRESH_MS = 26 * 60 * 60_000

export function BackupChip() {
  const backup = useUiStore((s) => s.backup)
  const openSettings = useUiStore((s) => s.openSettings)
  const now = useNow(60_000)

  const age = backup.lastBackupAt ? formatAge(backup.lastBackupAt, now) : null
  const fresh =
    backup.lastBackupAt != null && now.getTime() - Date.parse(backup.lastBackupAt) < FRESH_MS

  const view: Record<BackupMode, { dot: string; label: string; hint: string }> = {
    auto: fresh
      ? { dot: 'bg-emerald-500', label: `backup ${age}`, hint: 'Auto-backup is on. Click to back up now.' }
      : { dot: 'bg-amber-500', label: age ? `backup ${age}` : 'backup pending', hint: 'Backup is getting stale. Click to back up now.' },
    'permission-needed': { dot: 'bg-amber-500', label: 'allow backup', hint: 'Edge needs one click to re-allow the backup folder.' },
    unconfigured: age
      ? { dot: 'bg-amber-500', label: `backup ${age}`, hint: 'Manual export only. Click to set up auto-backup.' }
      : { dot: 'bg-amber-500', label: 'backups off', hint: 'No backups yet. Click to set up.' },
    blocked: age
      ? { dot: 'bg-amber-500', label: `backup ${age}`, hint: 'Folder access unavailable — manual exports only.' }
      : { dot: 'bg-amber-500', label: 'manual backups', hint: 'Folder access unavailable — export a file from Settings.' },
    error: { dot: 'bg-red-500', label: 'backup failed', hint: 'Last backup attempt failed. Click to retry now.' },
  }
  const v = view[backup.mode]

  const onClick = async () => {
    if (backup.mode === 'unconfigured' || backup.mode === 'blocked') {
      openSettings()
      return
    }
    const result = await maybeBackup('manual')
    if (result === 'off') openSettings()
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      title={v.hint}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />
      <span className="tabular-nums">{v.label}</span>
    </button>
  )
}
