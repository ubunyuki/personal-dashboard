import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  SCHEMA_VERSION,
  type BoardMeta,
  type Bookmark,
  type BookmarkGroup,
  type CalEvent,
  type GroupColor,
  type Note,
  type PersistedAppData,
  type Settings,
  type Task,
  type TileId,
  type WeatherSettings,
} from '../types'
import { newId, nowIso } from '../lib/id'
import { normalizeProjectTags } from '../lib/tasks/projectTags'
import { domainOf, normalizeUrl } from '../lib/bookmarks/url'
import { splitNoteForTask } from '../lib/notes/splitNoteForTask'
import { moveNoteIn } from '../features/notes/ordering'
import { moveTileIn, reconcileLayout, toggleTileIn } from '../lib/dashboard/layout'
import {
  clearProjectIn,
  moveProjectIn,
  renameProjectIn,
  setProjectColorIn,
} from '../features/tasks/projects'
import { defaultAppData, runMigrations } from './migrations'

export type TaskInput = Pick<Task, 'title'> &
  Partial<Omit<Task, 'id' | 'title' | 'createdAt' | 'updatedAt'>>

export type EventInput = Pick<CalEvent, 'title' | 'date'> & Partial<Pick<CalEvent, 'time'>>

export type BookmarkInput = { title: string; url: string; groupId?: string }

/** Settings patch where the nested weather object may itself be partial. */
export type SettingsPatch = Partial<Omit<Settings, 'weather'>> & { weather?: Partial<WeatherSettings> }

export type AppStore = PersistedAppData & {
  addTask: (input: TaskInput) => Task
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  deleteTask: (id: string) => void
  addNote: (text: string) => Note
  updateNote: (id: string, text: string) => void
  deleteNote: (id: string) => void
  /** Swap with the neighbour in display order (delta -1 = up, +1 = down). */
  moveNote: (id: string, delta: -1 | 1) => void
  /** Pin/unpin for the dashboard tile. */
  toggleNotePin: (id: string) => void
  /** Returns the created task, or null if the note is missing, empty, or already converted. */
  convertNoteToTask: (noteId: string) => Task | null
  addEvent: (input: EventInput) => CalEvent
  updateEvent: (id: string, patch: Partial<Omit<CalEvent, 'id' | 'createdAt'>>) => void
  deleteEvent: (id: string) => void
  addBoard: (name: string) => BoardMeta
  renameBoard: (id: string, name: string) => void
  deleteBoard: (id: string) => void
  /** Bumped by whiteboard autosave so backups notice board edits. */
  touchBoard: (id: string) => void
  addBookmark: (input: BookmarkInput) => Bookmark
  updateBookmark: (id: string, patch: Partial<Pick<Bookmark, 'title' | 'url' | 'groupId'>>) => void
  deleteBookmark: (id: string) => void
  addBookmarkGroup: (name: string) => BookmarkGroup
  updateBookmarkGroup: (id: string, patch: Partial<Pick<BookmarkGroup, 'name' | 'color'>>) => void
  /** Swap the group with its neighbour (delta -1 = up, +1 = down). */
  moveBookmarkGroup: (id: string, delta: -1 | 1) => void
  /** Deleting a group moves its bookmarks to Ungrouped. */
  deleteBookmarkGroup: (id: string) => void
  /** Rewrites every matching task tag; renaming onto an existing project merges. */
  renameProject: (from: string, to: string) => void
  /** undefined returns the project to its hash-derived colour. */
  setProjectColor: (name: string, color: GroupColor | undefined) => void
  /** Swap with the neighbour in derived order (delta -1 = up, +1 = down). */
  moveProject: (name: string, delta: -1 | 1) => void
  /** The tag comes off every member (their other tags stay); the project
   *  disappears, because it was only ever its tag. */
  clearProject: (name: string) => void
  /** Swap a dashboard tile with its neighbour (delta -1 = up, +1 = down). */
  moveDashboardTile: (id: TileId, delta: -1 | 1) => void
  /** Hide or show a tile; hidden tiles keep their slot in the order. */
  toggleDashboardTile: (id: TileId) => void
  /** Restore path: replaces all persisted data via merge-set (replace-mode would strip actions). */
  replaceAll: (data: PersistedAppData) => void
  updateSettings: (patch: SettingsPatch) => void
}

/**
 * The persisted slice of the store — the ONE definition of what hits
 * localStorage (persist's partialize) AND what backup envelopes contain
 * (buildFullEnvelope). persistedSlice.test.ts asserts it stays in sync
 * with defaultAppData(), so a new PersistedAppData field can't be missed.
 */
export const persistedSlice = (s: AppStore): PersistedAppData => ({
  tasks: s.tasks,
  notes: s.notes,
  events: s.events,
  boards: s.boards,
  bookmarks: s.bookmarks,
  bookmarkGroups: s.bookmarkGroups,
  projectMeta: s.projectMeta,
  dashboardLayout: s.dashboardLayout,
  settings: s.settings,
  lastChangeAt: s.lastChangeAt,
})

/** Keep completedAt in sync with status transitions unless the patch sets it explicitly. */
function withCompletion(prev: Task, patch: Partial<Task>): Partial<Task> {
  if (!patch.status || patch.status === prev.status) return patch
  if (patch.status === 'done') return { completedAt: nowIso(), ...patch }
  return { completedAt: undefined, ...patch }
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...defaultAppData(),

      addTask: (input) => {
        const now = nowIso()
        const task: Task = {
          id: newId(),
          title: input.title.trim(),
          description: input.description ?? '',
          status: input.status ?? 'todo',
          priority: input.priority ?? 'medium',
          dueDate: input.dueDate || undefined,
          dueTime: input.dueTime || undefined,
          projects: normalizeProjectTags(input.projects ?? []),
          sourceNoteId: input.sourceNoteId,
          createdAt: now,
          updatedAt: now,
          completedAt: input.status === 'done' ? now : undefined,
        }
        set((s) => ({ tasks: [task, ...s.tasks], lastChangeAt: now }))
        return task
      },

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...withCompletion(t, patch), updatedAt: nowIso() } : t,
          ),
          lastChangeAt: nowIso(),
        })),

      deleteTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          // Unlink any note that pointed at the deleted task.
          notes: s.notes.map((n) =>
            n.convertedToTaskId === id ? { ...n, convertedToTaskId: undefined } : n,
          ),
          lastChangeAt: nowIso(),
        })),

      addNote: (text) => {
        const now = nowIso()
        const note: Note = { id: newId(), text: text.trim(), createdAt: now, updatedAt: now }
        set((s) => ({ notes: [note, ...s.notes], lastChangeAt: now }))
        return note
      },

      updateNote: (id, text) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, text: text.trim(), updatedAt: nowIso() } : n,
          ),
          lastChangeAt: nowIso(),
        })),

      deleteNote: (id) =>
        set((s) => ({
          notes: s.notes.filter((n) => n.id !== id),
          // Tasks created from this note keep living, but drop the dangling link.
          tasks: s.tasks.map((t) =>
            t.sourceNoteId === id ? { ...t, sourceNoteId: undefined } : t,
          ),
          lastChangeAt: nowIso(),
        })),

      moveNote: (id, delta) =>
        set((s) => {
          const notes = moveNoteIn(s.notes, id, delta)
          if (notes === s.notes) return {}
          return { notes, lastChangeAt: nowIso() }
        }),

      // Neither move nor pin touches updatedAt — they are not edits of the
      // note text; lastChangeAt is what tells the backup something changed.
      toggleNotePin: (id) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, pinned: !(n.pinned ?? false) } : n)),
          lastChangeAt: nowIso(),
        })),

      convertNoteToTask: (noteId) => {
        const note = get().notes.find((n) => n.id === noteId)
        if (!note || note.convertedToTaskId) return null
        const { title, description } = splitNoteForTask(note.text)
        if (!title) return null
        const task = get().addTask({ title, description, sourceNoteId: noteId })
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === noteId ? { ...n, convertedToTaskId: task.id, updatedAt: nowIso() } : n,
          ),
          lastChangeAt: nowIso(),
        }))
        return task
      },

      addEvent: (input) => {
        const now = nowIso()
        const event: CalEvent = {
          id: newId(),
          title: input.title.trim(),
          date: input.date,
          time: input.time || undefined,
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ events: [...s.events, event], lastChangeAt: now }))
        return event
      },

      updateEvent: (id, patch) =>
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: nowIso() } : e)),
          lastChangeAt: nowIso(),
        })),

      deleteEvent: (id) =>
        set((s) => ({
          events: s.events.filter((e) => e.id !== id),
          lastChangeAt: nowIso(),
        })),

      addBoard: (name) => {
        const now = nowIso()
        const board: BoardMeta = {
          id: newId(),
          name: name.trim() || 'Untitled board',
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ boards: [board, ...s.boards], lastChangeAt: now }))
        return board
      },

      renameBoard: (id, name) =>
        set((s) => ({
          boards: s.boards.map((b) =>
            b.id === id ? { ...b, name: name.trim() || b.name, updatedAt: nowIso() } : b,
          ),
          lastChangeAt: nowIso(),
        })),

      deleteBoard: (id) =>
        set((s) => ({
          boards: s.boards.filter((b) => b.id !== id),
          lastChangeAt: nowIso(),
        })),

      touchBoard: (id) =>
        set((s) => ({
          boards: s.boards.map((b) => (b.id === id ? { ...b, updatedAt: nowIso() } : b)),
          lastChangeAt: nowIso(),
        })),

      addBookmark: (input) => {
        const now = nowIso()
        const url = normalizeUrl(input.url)
        const bookmark: Bookmark = {
          id: newId(),
          title: input.title.trim() || domainOf(url) || url,
          url,
          groupId: input.groupId,
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ bookmarks: [bookmark, ...s.bookmarks], lastChangeAt: now }))
        return bookmark
      },

      updateBookmark: (id, patch) =>
        set((s) => ({
          bookmarks: s.bookmarks.map((b) =>
            b.id === id
              ? {
                  ...b,
                  ...patch,
                  ...(patch.url !== undefined ? { url: normalizeUrl(patch.url) } : {}),
                  updatedAt: nowIso(),
                }
              : b,
          ),
          lastChangeAt: nowIso(),
        })),

      deleteBookmark: (id) =>
        set((s) => ({
          bookmarks: s.bookmarks.filter((b) => b.id !== id),
          lastChangeAt: nowIso(),
        })),

      addBookmarkGroup: (name) => {
        const now = nowIso()
        const group: BookmarkGroup = {
          id: newId(),
          name: name.trim() || 'Untitled group',
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ bookmarkGroups: [...s.bookmarkGroups, group], lastChangeAt: now }))
        return group
      },

      updateBookmarkGroup: (id, patch) =>
        set((s) => ({
          bookmarkGroups: s.bookmarkGroups.map((g) =>
            g.id === id
              ? {
                  ...g,
                  ...patch,
                  name: patch.name !== undefined ? patch.name.trim() || g.name : g.name,
                  updatedAt: nowIso(),
                }
              : g,
          ),
          lastChangeAt: nowIso(),
        })),

      moveBookmarkGroup: (id, delta) =>
        set((s) => {
          const i = s.bookmarkGroups.findIndex((g) => g.id === id)
          const j = i + delta
          if (i < 0 || j < 0 || j >= s.bookmarkGroups.length) return {}
          const next = [...s.bookmarkGroups]
          ;[next[i], next[j]] = [next[j], next[i]]
          return { bookmarkGroups: next, lastChangeAt: nowIso() }
        }),

      deleteBookmarkGroup: (id) =>
        set((s) => ({
          bookmarkGroups: s.bookmarkGroups.filter((g) => g.id !== id),
          // Members keep living, just ungrouped.
          bookmarks: s.bookmarks.map((b) =>
            b.groupId === id ? { ...b, groupId: undefined } : b,
          ),
          lastChangeAt: nowIso(),
        })),

      renameProject: (from, to) =>
        set((s) => {
          const r = renameProjectIn(s.tasks, s.projectMeta, from, to, nowIso())
          if (r.tasks === s.tasks && r.projectMeta === s.projectMeta) return {}
          return { ...r, lastChangeAt: nowIso() }
        }),

      setProjectColor: (name, color) =>
        set((s) => ({
          projectMeta: setProjectColorIn(s.projectMeta, name, color, nowIso()),
          lastChangeAt: nowIso(),
        })),

      moveProject: (name, delta) =>
        set((s) => {
          const projectMeta = moveProjectIn(s.tasks, s.projectMeta, name, delta, nowIso())
          if (projectMeta === s.projectMeta) return {}
          return { projectMeta, lastChangeAt: nowIso() }
        }),

      clearProject: (name) =>
        set((s) => ({
          ...clearProjectIn(s.tasks, s.projectMeta, name, nowIso()),
          lastChangeAt: nowIso(),
        })),

      // Both reconcile FIRST, so the no-op check compares against what the
      // dashboard actually renders rather than against a stale stored array.
      moveDashboardTile: (id, delta) =>
        set((s) => {
          const current = reconcileLayout(s.dashboardLayout)
          const next = moveTileIn(current, id, delta)
          if (next === current) return {}
          return { dashboardLayout: next, lastChangeAt: nowIso() }
        }),

      toggleDashboardTile: (id) =>
        set((s) => {
          const current = reconcileLayout(s.dashboardLayout)
          const next = toggleTileIn(current, id)
          if (next === current) return {}
          return { dashboardLayout: next, lastChangeAt: nowIso() }
        }),

      replaceAll: (data) => set({ ...data }),

      updateSettings: (patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            ...patch,
            weather: { ...s.settings.weather, ...(patch.weather ?? {}) },
          },
          lastChangeAt: nowIso(),
        })),
    }),
    {
      name: 'pwd:app',
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: persistedSlice,
      migrate: (persisted, version) => runMigrations(persisted, version),
    },
  ),
)
