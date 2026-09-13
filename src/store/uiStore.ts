import { create } from 'zustand'

export type Tab = 'dashboard' | 'tasks' | 'notes'

type UiStore = {
  activeTab: Tab
  /** null = check still running */
  storagePersisted: boolean | null
  /** task id being edited, 'new' for a fresh task, null = editor closed */
  editingTask: string | 'new' | null
  settingsOpen: boolean
  /** Bumped to tell the notes capture box to grab focus. */
  noteFocusToken: number
  setActiveTab: (tab: Tab) => void
  setStoragePersisted: (granted: boolean) => void
  openTaskEditor: (id?: string) => void
  closeTaskEditor: () => void
  openSettings: () => void
  closeSettings: () => void
  focusNoteCapture: () => void
}

export const useUiStore = create<UiStore>()((set) => ({
  activeTab: 'dashboard',
  storagePersisted: null,
  editingTask: null,
  settingsOpen: false,
  noteFocusToken: 0,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setStoragePersisted: (granted) => set({ storagePersisted: granted }),
  openTaskEditor: (id) => set({ editingTask: id ?? 'new' }),
  closeTaskEditor: () => set({ editingTask: null }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  focusNoteCapture: () => set((s) => ({ activeTab: 'notes', noteFocusToken: s.noteFocusToken + 1 })),
}))
