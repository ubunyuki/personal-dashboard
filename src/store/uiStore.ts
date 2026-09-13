import { create } from 'zustand'

export type Tab = 'dashboard' | 'tasks' | 'notes'

type UiStore = {
  activeTab: Tab
  /** null = check still running */
  storagePersisted: boolean | null
  /** task id being edited, 'new' for a fresh task, null = editor closed */
  editingTask: string | 'new' | null
  setActiveTab: (tab: Tab) => void
  setStoragePersisted: (granted: boolean) => void
  openTaskEditor: (id?: string) => void
  closeTaskEditor: () => void
}

export const useUiStore = create<UiStore>()((set) => ({
  activeTab: 'dashboard',
  storagePersisted: null,
  editingTask: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setStoragePersisted: (granted) => set({ storagePersisted: granted }),
  openTaskEditor: (id) => set({ editingTask: id ?? 'new' }),
  closeTaskEditor: () => set({ editingTask: null }),
}))
