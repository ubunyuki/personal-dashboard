import { create } from 'zustand'

export type Tab = 'dashboard' | 'tasks' | 'notes'

export type BackupMode = 'unconfigured' | 'auto' | 'permission-needed' | 'blocked' | 'error'

export interface BackupStatus {
  mode: BackupMode
  lastBackupAt: string | null
}

type UiStore = {
  activeTab: Tab
  /** null = check still running */
  storagePersisted: boolean | null
  /** task id being edited, 'new' for a fresh task, null = editor closed */
  editingTask: string | 'new' | null
  settingsOpen: boolean
  /** Bumped to tell the notes capture box to grab focus. */
  noteFocusToken: number
  backup: BackupStatus
  restorePrompt: 'tripwire' | 'import' | null
  setActiveTab: (tab: Tab) => void
  setStoragePersisted: (granted: boolean) => void
  openTaskEditor: (id?: string) => void
  closeTaskEditor: () => void
  openSettings: () => void
  closeSettings: () => void
  focusNoteCapture: () => void
  setBackupStatus: (status: BackupStatus) => void
  openRestorePrompt: (kind: 'tripwire' | 'import') => void
  closeRestorePrompt: () => void
}

export const useUiStore = create<UiStore>()((set) => ({
  activeTab: 'dashboard',
  storagePersisted: null,
  editingTask: null,
  settingsOpen: false,
  noteFocusToken: 0,
  backup: { mode: 'unconfigured', lastBackupAt: null },
  restorePrompt: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setStoragePersisted: (granted) => set({ storagePersisted: granted }),
  openTaskEditor: (id) => set({ editingTask: id ?? 'new' }),
  closeTaskEditor: () => set({ editingTask: null }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  focusNoteCapture: () => set((s) => ({ activeTab: 'notes', noteFocusToken: s.noteFocusToken + 1 })),
  setBackupStatus: (status) => set({ backup: status }),
  openRestorePrompt: (kind) => set({ restorePrompt: kind, settingsOpen: false }),
  closeRestorePrompt: () => set({ restorePrompt: null }),
}))
