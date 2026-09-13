import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { SCHEMA_VERSION, type PersistedAppData, type Settings, type Task } from '../types'
import { newId, nowIso } from '../lib/id'
import { defaultAppData, runMigrations } from './migrations'

export type TaskInput = Pick<Task, 'title'> &
  Partial<Omit<Task, 'id' | 'title' | 'createdAt' | 'updatedAt'>>

export type AppStore = PersistedAppData & {
  addTask: (input: TaskInput) => Task
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  deleteTask: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
}

/** Keep completedAt in sync with status transitions unless the patch sets it explicitly. */
function withCompletion(prev: Task, patch: Partial<Task>): Partial<Task> {
  if (!patch.status || patch.status === prev.status) return patch
  if (patch.status === 'done') return { completedAt: nowIso(), ...patch }
  return { completedAt: undefined, ...patch }
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
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
