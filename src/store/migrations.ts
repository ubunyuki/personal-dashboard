import { SCHEMA_VERSION, type PersistedAppData, type Settings } from '../types'

export function defaultSettings(): Settings {
  return {
    theme: 'system',
    weather: { enabled: true, source: 'hko', hkoStation: 'Hong Kong Observatory', unit: 'celsius' },
    weekStartsOn: 1,
  }
}

export function defaultAppData(): PersistedAppData {
  return {
    tasks: [],
    notes: [],
    events: [],
    boards: [],
    settings: defaultSettings(),
    lastChangeAt: null,
  }
}

/** One entry per version bump: steps[n] migrates shape n → n+1. */
const steps: Record<number, (d: Partial<PersistedAppData>) => Partial<PersistedAppData>> = {
  // v1 → v2: settings.weather gained source + hkoStation; the defaults spread fills them.
  1: (d) => d,
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
