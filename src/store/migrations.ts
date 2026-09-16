import { SCHEMA_VERSION, type PersistedAppData, type Settings, type Task } from '../types'
import { defaultLayout } from '../lib/dashboard/layout'
import { normalizeProjectTags } from '../lib/tasks/projectTags'

export function defaultSettings(): Settings {
  return {
    theme: 'system',
    weather: {
      enabled: true,
      source: 'hko',
      hkoStation: 'Hong Kong Observatory',
      unit: 'celsius',
      labelStyle: 'name',
      warnings: { enabled: true, notify: true, sound: true },
    },
    weekStartsOn: 0,
  }
}

export function defaultAppData(): PersistedAppData {
  return {
    tasks: [],
    notes: [],
    events: [],
    boards: [],
    bookmarks: [],
    bookmarkGroups: [],
    projectMeta: [],
    dashboardLayout: defaultLayout(),
    busStops: [],
    settings: defaultSettings(),
    lastChangeAt: null,
  }
}

/** One entry per version bump: steps[n] migrates shape n → n+1. */
const steps: Record<number, (d: Partial<PersistedAppData>) => Partial<PersistedAppData>> = {
  // v1 → v2: settings.weather gained source + hkoStation; the defaults spread fills them.
  1: (d) => d,
  // v2 → v3: bookmarks + bookmarkGroups collections added; the defaults spread fills them.
  2: (d) => d,
  // v3 → v4: the week starts on Sunday for EVERYONE, not just new installs, so
  // this rewrites the stored value instead of leaving existing users on Monday.
  3: (d) => (d.settings ? { ...d, settings: { ...d.settings, weekStartsOn: 0 } } : d),
  // v4 → v5: one project tag per task becomes a list. The old key is dropped
  // rather than left behind, so nothing can read a stale single tag later.
  4: (d) => {
    if (!Array.isArray(d.tasks)) return d
    return {
      ...d,
      tasks: d.tasks.map((t) => {
        const { project, ...rest } = t as Task & { project?: unknown }
        const projects = normalizeProjectTags(typeof project === 'string' ? [project] : [])
        return projects ? { ...rest, projects } : rest
      }),
    }
  },
}

/**
 * Single migration path for BOTH zustand persist rehydration and backup
 * restore. Always returns a complete PersistedAppData (defaults spread
 * underneath) so zustand's shallow merge is safe.
 */
export function runMigrations(persisted: unknown, fromVersion: number): PersistedAppData {
  if (fromVersion > SCHEMA_VERSION) {
    throw new Error(
      `Data is schema v${fromVersion} but this app only knows v${SCHEMA_VERSION}. Update the app first.`,
    )
  }
  let data = (persisted ?? {}) as Partial<PersistedAppData>
  for (let v = fromVersion; v < SCHEMA_VERSION; v++) {
    const step = steps[v]
    if (!step) throw new Error(`Missing migration step v${v} → v${v + 1}`)
    data = step(data)
  }
  const defaults = defaultAppData()
  return {
    ...defaults,
    ...data,
    settings: {
      ...defaults.settings,
      ...(data.settings ?? {}),
      weather: { ...defaults.settings.weather, ...(data.settings?.weather ?? {}) },
    },
  }
}
