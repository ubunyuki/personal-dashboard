/**
 * Conventions:
 * - ids: crypto.randomUUID()
 * - createdAt/updatedAt/completedAt/exportedAt: ISO-8601 UTC strings
 * - date: LOCAL calendar string 'yyyy-MM-dd'; time: 'HH:mm' (24h).
 *   Parse with date-fns, never `new Date('yyyy-MM-dd')` (that is UTC midnight).
 */
export const SCHEMA_VERSION = 5

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
  /** Free-text tags, comma-separated in the editor. A task appears under
   *  EVERY tag it carries; read them through projectsOf, never directly. */
  projects?: string[]
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
  /** Explicit display rank, written only once the user reorders; absent means
   *  "unranked", which sorts newest-first. See features/notes/ordering.ts. */
  order?: number
  /** Pinned notes also render as a dashboard tile. */
  pinned?: boolean
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

/** Tint choices for bookmark group cards and project tags. */
export type GroupColor = 'sky' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet'

/** Canonical value list for GroupColor — swatch pickers iterate this. */
export const GROUP_COLORS: readonly GroupColor[] = [
  'sky',
  'indigo',
  'emerald',
  'amber',
  'rose',
  'violet',
]

export interface BookmarkGroup {
  id: string
  name: string
  /** Card tint on the Bookmarks page; undefined = 'sky'. */
  color?: GroupColor
  createdAt: string
  updatedAt: string
}

export interface Bookmark {
  id: string
  title: string
  url: string
  /** undefined = ungrouped */
  groupId?: string
  createdAt: string
  updatedAt: string
}

/**
 * Decoration for a project tag — the tag string on tasks IS the project's
 * identity; this side-car only carries colour and ordering.
 *
 * Deliberately added WITHOUT a SCHEMA_VERSION bump, which is safe ONLY for a
 * top-level collection: zustand's shallow merge keeps the default [] when the
 * key is absent from old persisted data, and restores run runMigrations,
 * whose defaults spread fills it unconditionally. A NESTED field gets no such
 * backfill on same-version rehydration (the shallow merge replaces the whole
 * parent object) — that's why settings.weather.labelStyle is read as
 * `?? 'name'` everywhere. Top-level absent key: safe. Nested: not.
 */
export interface ProjectMeta {
  /** Matches a Task.projects entry exactly (trimmed). */
  name: string
  /** undefined = derived from a hash of the name. */
  color?: GroupColor
  /** undefined sorts after ordered entries, then alphabetically. */
  order?: number
  updatedAt: string
}

export interface WeatherLocation {
  name: string
  admin1?: string
  country?: string
  latitude: number
  longitude: number
}

export type WeatherSource = 'hko' | 'open-meteo'

/**
 * HKO weather-warning alerts. Nested under `weather` deliberately: the
 * one-level deep-merge in updateSettings already covers that key, so no merge
 * change is needed. Nested also means no backfill on same-version rehydration
 * — read these through `warningSettings()`, never field by field.
 */
export interface WarningSettings {
  /** Poll HKO and show the status-bar chip. */
  enabled?: boolean
  /** Also raise an OS Notification, when the user has granted permission. */
  notify?: boolean
  /** Play a chime with the in-app alert. */
  sound?: boolean
}

export interface WeatherSettings {
  enabled: boolean
  /** 'hko' = Hong Kong Observatory official readings; 'open-meteo' = any city. */
  source: WeatherSource
  hkoStation: string
  location?: WeatherLocation
  unit: 'celsius' | 'fahrenheit'
  /** Chip label style: full place name (default) or a short code like "ST". */
  labelStyle?: 'name' | 'code'
  warnings?: WarningSettings
}

export interface Settings {
  theme: 'system' | 'light' | 'dark'
  weather: WeatherSettings
  /** 0 = Sunday, 1 = Monday. Threaded into every week calculation — never
   *  hardcode it, or the dashboard and the review drawer can disagree. */
  weekStartsOn: 0 | 1
}

/** Exactly what zustand persist writes (partialize output). */
export interface PersistedAppData {
  tasks: Task[]
  notes: Note[]
  events: CalEvent[]
  boards: BoardMeta[]
  bookmarks: Bookmark[]
  bookmarkGroups: BookmarkGroup[]
  /** Colour/order side-car for project tags — see ProjectMeta. NOT in
   *  requiredArraysFor: pre-M20 v3 backups lack it and must stay valid. */
  projectMeta: ProjectMeta[]
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
