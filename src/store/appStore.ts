import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { SCHEMA_VERSION, type PersistedAppData, type Settings } from '../types'
import { nowIso } from '../lib/id'
import { defaultAppData, runMigrations } from './migrations'

export type AppStore = PersistedAppData & {
  updateSettings: (patch: Partial<Settings>) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...defaultAppData(),

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
