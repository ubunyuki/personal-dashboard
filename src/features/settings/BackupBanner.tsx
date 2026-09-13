import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { useNow } from '../../lib/useNow'
import { maybeBackup } from '../../lib/backup/autoBackup'
import { exportBackupFile } from '../../lib/backup/exportImport'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

const SNOOZE_KEY = 'pwd:backup-snooze'
const DAY = 24 * 60 * 60_000
const STALE_MS = 3 * DAY

function snoozedNow(): boolean {
  try {
    const until = localStorage.getItem(SNOOZE_KEY)
    return until != null && Date.now() < Date.parse(until)
  } catch {
    return false
  }
}

export function BackupBanner() {
  const backup = useUiStore((s) => s.backup)
  const openSettings = useUiStore((s) => s.openSettings)
  const lastChangeAt = useAppStore((s) => s.lastChangeAt)
  const now = useNow(60_000)
  const [snoozed, setSnoozed] = useState(snoozedNow)

  if (!lastChangeAt || snoozed || snoozedNow()) return null

  const configured =
    backup.mode === 'auto' || backup.mode === 'permission-needed' || backup.mode === 'error'
  const ageMs = backup.lastBackupAt
    ? now.getTime() - Date.parse(backup.lastBackupAt)
    : Number.POSITIVE_INFINITY
  const show = configured ? ageMs > STALE_MS : ageMs > 7 * DAY || backup.lastBackupAt === null
  if (!show) return null

  const snooze = () => {
    try {
      const days = configured ? 1 : 7
      localStorage.setItem(SNOOZE_KEY, new Date(Date.now() + days * DAY).toISOString())
    } catch {
      // ignore
    }
    setSnoozed(true)
  }

  const text = configured
    ? 'Backups are getting stale — your recent work is not backed up yet.'
    : backup.mode === 'blocked'
      ? 'Reminder: browser storage can be wiped by IT — download a backup file now and then.'
      : 'Protect your data: set up automatic backups to a OneDrive folder.'
  const action = configured
    ? { label: 'Back up now', run: () => void maybeBackup('manual') }
    : backup.mode === 'blocked'
      ? { label: 'Export now', run: () => void exportBackupFile().then(() => setSnoozed(true)) }
      : { label: 'Set up', run: openSettings }

  return (
    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <TriangleAlert size={14} className="shrink-0" />
      <span className="min-w-0 flex-1">{text}</span>
      <button
        type="button"
        onClick={action.run}
        className="rounded-md bg-amber-600 px-2 py-0.5 font-medium text-white hover:bg-amber-500"
      >
        {action.label}
      </button>
      <button
        type="button"
        onClick={snooze}
        className="rounded-md px-2 py-0.5 hover:bg-amber-100 dark:hover:bg-amber-900"
      >
        Later
      </button>
    </div>
  )
}
