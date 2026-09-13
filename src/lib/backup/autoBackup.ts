import { useAppStore } from '../../store/appStore'
import { useUiStore, type BackupMode } from '../../store/uiStore'
import { loadDirHandle } from '../storage/idb'
import { nowIso } from '../id'
import { readBackupMeta, writeBackupMeta, type BackupMeta } from './meta'
import { buildFullEnvelope } from './exportImport'
import { fsAccessSupported, pruneSnapshots, queryPerm, requestPerm, writeSnapshotFile } from './fsAccess'
import { snapshotFileName } from './prune'

const HOUR = 60 * 60_000
const TICK = 5 * 60_000

/** Snapshot when data changed and the last one is over an hour old. */
export function isBackupDue(meta: BackupMeta | null, lastChangeAt: string | null): boolean {
  if (!lastChangeAt) return false
  if (meta?.lastChangeSeen === lastChangeAt) return false
  if (!meta?.lastBackupAt) return true
  return Date.now() - Date.parse(meta.lastBackupAt) > HOUR
}

async function currentMode(): Promise<BackupMode> {
  if (!fsAccessSupported()) return 'blocked'
  const handle = await loadDirHandle()
  if (!handle) return 'unconfigured'
  const perm = await queryPerm(handle)
  if (perm !== 'granted') return 'permission-needed'
  return readBackupMeta()?.lastAttemptFailed ? 'error' : 'auto'
}

export async function refreshBackupStatus(): Promise<void> {
  const mode = await currentMode()
  useUiStore.getState().setBackupStatus({
    mode,
    lastBackupAt: readBackupMeta()?.lastBackupAt ?? null,
  })
}

let running = false

export type BackupResult = 'written' | 'skipped' | 'needs-permission' | 'off' | 'error'

/**
 * The one backup entry point. 'manual' runs inside a user gesture, so it may
 * call requestPermission; automatic triggers must stay silent.
 */
export async function maybeBackup(trigger: 'boot' | 'tick' | 'manual'): Promise<BackupResult> {
  if (running) return 'skipped'
  running = true
  try {
    if (!fsAccessSupported()) return 'off'
    const handle = await loadDirHandle()
    if (!handle) return 'off'
    const s = useAppStore.getState()
    if (trigger !== 'manual' && !isBackupDue(readBackupMeta(), s.lastChangeAt)) return 'skipped'
    let perm = await queryPerm(handle)
    if (perm !== 'granted' && trigger === 'manual') perm = await requestPerm(handle)
    if (perm !== 'granted') return 'needs-permission'
    const env = await buildFullEnvelope()
    const name = snapshotFileName(new Date())
    await writeSnapshotFile(handle, name, JSON.stringify(env))
    await pruneSnapshots(handle)
    writeBackupMeta({
      lastBackupAt: nowIso(),
      lastBackupFile: name,
      lastAttemptFailed: false,
      lastChangeSeen: env.appData.lastChangeAt ?? undefined,
    })
    return 'written'
  } catch {
    // OneDrive/AV can transiently lock files — mark it and retry next tick.
    writeBackupMeta({ lastAttemptFailed: true })
    return 'error'
  } finally {
    running = false
    void refreshBackupStatus()
  }
}

/** Boot: tripwire check, marker, status, schedules. Called once from main.tsx. */
export async function initBackups(): Promise<void> {
  const meta = readBackupMeta()
  const handle = fsAccessSupported() ? await loadDirHandle() : undefined
  if (handle && !meta) {
    // A backup folder is remembered in IndexedDB but the localStorage marker
    // is gone → site data was (at least partially) cleared.
    useUiStore.getState().openRestorePrompt('tripwire')
    // Marker is re-written when the prompt is dismissed or a restore runs.
  } else if (!meta) {
    writeBackupMeta({})
  }
  await refreshBackupStatus()
  void maybeBackup('boot')
  window.setInterval(() => void maybeBackup('tick'), TICK)
  // Wake-up check: returning to the tab Monday morning should snapshot
  // immediately, not wait for the next interval tick.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void maybeBackup('tick')
  })
}
