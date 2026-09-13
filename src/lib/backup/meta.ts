/**
 * Backup bookkeeping + the tripwire marker. Lives OUTSIDE the zustand store
 * so writing it never bumps lastChangeAt (which would make every backup look
 * like a data change and loop the hourly rule forever).
 */
export interface BackupMeta {
  marker: 1
  lastBackupAt?: string
  lastBackupFile?: string
  lastAttemptFailed?: boolean
  /** The appData.lastChangeAt value covered by the last successful backup/export. */
  lastChangeSeen?: string
}

const KEY = 'pwd:backup-meta'

export function readBackupMeta(): BackupMeta | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BackupMeta
    return parsed && parsed.marker === 1 ? parsed : null
  } catch {
    return null
  }
}

export function writeBackupMeta(patch: Partial<Omit<BackupMeta, 'marker'>>): void {
  try {
    const current = readBackupMeta() ?? {}
    localStorage.setItem(KEY, JSON.stringify({ ...current, ...patch, marker: 1 }))
  } catch {
    // storage unavailable — nothing we can do
  }
}
