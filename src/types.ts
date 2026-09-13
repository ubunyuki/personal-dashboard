/**
 * Conventions:
 * - ids: crypto.randomUUID()
 * - createdAt/updatedAt/completedAt/exportedAt: ISO-8601 UTC strings
 * - date: LOCAL calendar string 'yyyy-MM-dd'; time: 'HH:mm' (24h).
 *   Parse with date-fns, never `new Date('yyyy-MM-dd')` (that is UTC midnight).
 */
export const SCHEMA_VERSION = 1

export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  dueTime?: string
  /** Free-text tag; a future Projects page groups on this. */
  project?: string
  /** Set when the task was created by converting a note. */
  sourceNoteId?: string
  createdAt: string
  updatedAt: string
  /** Set on status→done, cleared on un-done; feeds "done this week". */
  completedAt?: string
}

export interface Note {
  id: string
  text: string
  convertedToTaskId?: string
  createdAt: string
  updatedAt: string
}

export interface CalEvent {
  id: string
  title: string
  date: string
  time?: string
  createdAt: string
  updatedAt: string
}

export interface BoardMeta {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface WeatherLocation {
  name: string
  admin1?: string
  country?: string
  latitude: number
  longitude: number
}

export interface WeatherSettings {
  enabled: boolean
  location?: WeatherLocation
  unit: 'celsius' | 'fahrenheit'
}

export interface Settings {
  theme: 'system' | 'light' | 'dark'
  weather: WeatherSettings
  weekStartsOn: 1
}

/** Exactly what zustand persist writes (partialize output). */
export interface PersistedAppData {
  tasks: Task[]
  notes: Note[]
  events: CalEvent[]
  boards: BoardMeta[]
  settings: Settings
  /** Bumped only by data mutations, never by backup bookkeeping. */
  lastChangeAt: string | null
}

/** Excalidraw scene as stored in IDB and in the backup envelope.
 *  appState is an allowlist — the full appState contains a Map. */
export interface StoredSceneAppState {
  viewBackgroundColor?: string
  scrollX?: number
  scrollY?: number
  zoom?: { value: number }
}

export interface StoredScene {
  elements: unknown[]
  appState: StoredSceneAppState
  files: Record<string, unknown>
}

export interface BackupEnvelope {
  version: number
  exportedAt: string
  appData: PersistedAppData
  boards: Array<{ id: string; name: string; scene: StoredScene }>
}
