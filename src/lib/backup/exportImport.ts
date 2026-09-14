import { type BackupEnvelope, type PersistedAppData, type StoredScene } from '../../types'
import { useAppStore } from '../../store/appStore'
import { loadScene, saveScene } from '../storage/idb'
import { nowIso } from '../id'
import { buildEnvelope, applyEnvelope, validateEnvelope } from './envelope'
import { snapshotFileName } from './prune'
import { writeBackupMeta } from './meta'

const emptyScene = (): StoredScene => ({ elements: [], appState: {}, files: {} })

export async function buildFullEnvelope(): Promise<BackupEnvelope> {
  const s = useAppStore.getState()
  const appData: PersistedAppData = {
    tasks: s.tasks,
    notes: s.notes,
    events: s.events,
    boards: s.boards,
    bookmarks: s.bookmarks,
    bookmarkGroups: s.bookmarkGroups,
    settings: s.settings,
    lastChangeAt: s.lastChangeAt,
  }
  const boards = await Promise.all(
    s.boards.map(async (b) => ({
      id: b.id,
      name: b.name,
      scene: (await loadScene(b.id)) ?? emptyScene(),
    })),
  )
  return buildEnvelope(appData, boards)
}

/** Manual "Export now": downloads a backup file. Works in every browser. */
export async function exportBackupFile(): Promise<string> {
  const env = await buildFullEnvelope()
  const name = snapshotFileName(new Date())
  const blob = new Blob([JSON.stringify(env, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  writeBackupMeta({
    lastBackupAt: nowIso(),
    lastBackupFile: name,
    lastAttemptFailed: false,
    lastChangeSeen: env.appData.lastChangeAt ?? undefined,
  })
  return name
}

export async function readEnvelopeFile(file: File): Promise<BackupEnvelope> {
  let raw: unknown
  try {
    raw = JSON.parse(await file.text())
  } catch {
    throw new Error('That file is not valid JSON — truncated download or wrong file?')
  }
  return validateEnvelope(raw)
}

/** Replaces ALL app data with the envelope's content, then reloads. */
export async function restoreEnvelope(env: BackupEnvelope): Promise<void> {
  const { appData, boards } = applyEnvelope(env)
  for (const b of boards) await saveScene(b.id, b.scene)
  useAppStore.getState().replaceAll(appData)
  writeBackupMeta({
    lastBackupAt: nowIso(),
    lastAttemptFailed: false,
    lastChangeSeen: appData.lastChangeAt ?? undefined,
  })
  location.reload()
}
