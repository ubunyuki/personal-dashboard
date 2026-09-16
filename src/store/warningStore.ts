import { create } from 'zustand'
import type { WarningSnapshot } from '../lib/weather/warnings'

/** The in-app notification raised when the hoisted set changes. Sticks until
 *  dismissed — a signal change is rare and worth acknowledging explicitly. */
export interface WarningAlert {
  /** Monotonic, so an identical repeat still remounts the toast. */
  id: number
  title: string
  body: string
  at: string
}

type WarningState = {
  /** null = no poll has landed yet and no usable cache. */
  snapshot: WarningSnapshot | null
  /** True after a failed poll, cleared on the next success. */
  error: boolean
  alert: WarningAlert | null
}

type WarningStore = WarningState & {
  setSnapshot: (snapshot: WarningSnapshot) => void
  setError: (error: boolean) => void
  raiseAlert: (title: string, body: string, at: string) => void
  dismissAlert: () => void
  reset: () => void
}

const initial = (): WarningState => ({ snapshot: null, error: false, alert: null })

/**
 * Live HKO warning state. Separate from appStore because none of it is user
 * data — nothing here is persisted or backed up — and separate from uiStore
 * because it is not UI state either. The poll writes; the chip, the panel and
 * the toast read. Whether the panel is *open* lives in uiStore with the other
 * status-bar popovers, which are mutually exclusive.
 */
export const useWarningStore = create<WarningStore>()((set) => ({
  ...initial(),
  setSnapshot: (snapshot) => set({ snapshot, error: false }),
  setError: (error) => set({ error }),
  raiseAlert: (title, body, at) =>
    set((s) => ({ alert: { id: (s.alert?.id ?? 0) + 1, title, body, at } })),
  dismissAlert: () => set({ alert: null }),
  reset: () => set(initial()),
}))
