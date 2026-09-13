import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  SCHEMA_VERSION,
  type BoardMeta,
  type CalEvent,
  type Note,
  type PersistedAppData,
  type Settings,
  type Task,
  type WeatherSettings,
} from '../types'
import { newId, nowIso } from '../lib/id'
import { splitNoteForTask } from '../lib/notes/splitNoteForTask'
import { defaultAppData, runMigrations } from './migrations'

export type TaskInput = Pick<Task, 'title'> &
  Partial<Omit<Task, 'id' | 'title' | 'createdAt' | 'updatedAt'>>

export type EventInput = Pick<CalEvent, 'title' | 'date'> & Partial<Pick<CalEvent, 'time'>>

/** Settings patch where the nested weather object may itself be partial. */
export type SettingsPatch = Partial<Omit<Settings, 'weather'>> & { weather?: Partial<WeatherSettings> }

export type AppStore = PersistedAppData & {
  addTask: (input: TaskInput) => Task
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  deleteTask: (id: string) => void
  addNote: (text: string) => Note
  updateNote: (id: string, text: string) => void
  deleteNote: (id: string) => void
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
  /** Restore path: replaces all persisted data via merge-set (replace-mode would strip actions). */
  replaceAll: (data: PersistedAppData) => void
  updateSettings: (patch: SettingsPatch) => void
}

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
          project: input.project?.trim() || undefined,
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
      partialize: (s): PersistedAppData => ({
        tasks: s.tasks,
        notes: s.notes,
        events: s.events,
        boards: s.boards,
        settings: s.settings,
        lastChangeAt: s.lastChangeAt,
      }),
      migrate: (persisted, version) => runMigrations(persisted, version),
    },
  ),
)
