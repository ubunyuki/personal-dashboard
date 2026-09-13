import {
  SCHEMA_VERSION,
  type BackupEnvelope,
  type PersistedAppData,
  type StoredScene,
} from '../../types'
import { nowIso } from '../id'
import { runMigrations } from '../../store/migrations'

export function buildEnvelope(
  appData: PersistedAppData,
  boards: BackupEnvelope['boards'],
): BackupEnvelope {
  return { version: SCHEMA_VERSION, exportedAt: nowIso(), appData, boards }
}

/**
 * Structural validation of an untrusted parsed JSON value. Field-level
 * sanitizing beyond this is runMigrations' job (defaults spread underneath).
 * NOTE: checks assume the v1 field names; if a future migration renames
 * fields, validation must become version-aware.
 */
export function validateEnvelope(raw: unknown): BackupEnvelope {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('Not a backup file (expected a JSON object).')
  }
  const env = raw as Record<string, unknown>
  if (typeof env.version !== 'number') {
    throw new Error('Missing schema version — this is not a WorkDesk backup file.')
  }
  if (env.version > SCHEMA_VERSION) {
    throw new Error(
      `This backup uses schema v${env.version}, but the app only knows v${SCHEMA_VERSION}. Update the app first.`,
    )
  }
  if (typeof env.appData !== 'object' || env.appData === null) {
    throw new Error('Backup has no appData section.')
  }
  const appData = env.appData as Record<string, unknown>
  for (const key of ['tasks', 'notes', 'events', 'boards'] as const) {
    if (!Array.isArray(appData[key])) {
      throw new Error(`Backup field appData.${key} is missing or not a list.`)
    }
  }
  const boardsRaw = env.boards ?? []
  if (!Array.isArray(boardsRaw)) throw new Error('Backup field boards is not a list.')
  const boards = boardsRaw.map((b, i) => {
    if (typeof b !== 'object' || b === null) throw new Error(`Backup board #${i + 1} is malformed.`)
    const bb = b as Record<string, unknown>
    if (typeof bb.id !== 'string' || typeof bb.name !== 'string') {
      throw new Error(`Backup board #${i + 1} is missing its id or name.`)
    }
    const scene = bb.scene as Record<string, unknown> | null | undefined
    if (typeof scene !== 'object' || scene === null || !Array.isArray(scene.elements)) {
      throw new Error(`Backup board “${bb.name}” has a malformed scene.`)
    }
    return { id: bb.id, name: bb.name, scene: scene as unknown as StoredScene }
  })
  return {
    version: env.version,
    exportedAt: typeof env.exportedAt === 'string' ? env.exportedAt : '',
    appData: appData as unknown as PersistedAppData,
    boards,
  }
}

/** Migrate the envelope's appData to the current schema. One migration path
 *  shared with zustand persist rehydration. */
export function applyEnvelope(env: BackupEnvelope): {
  appData: PersistedAppData
  boards: BackupEnvelope['boards']
} {
  return { appData: runMigrations(env.appData, env.version), boards: env.boards }
}

export interface EnvelopeSummary {
  tasks: number
  notes: number
  events: number
  boards: number
  exportedAt: string
}

export function summarizeEnvelope(env: BackupEnvelope): EnvelopeSummary {
  return {
    tasks: env.appData.tasks?.length ?? 0,
    notes: env.appData.notes?.length ?? 0,
    events: env.appData.events?.length ?? 0,
    boards: env.boards.length,
    exportedAt: env.exportedAt,
  }
}
