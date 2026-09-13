import { create } from 'zustand'

export type Tab = 'dashboard' | 'tasks' | 'notes'

type UiStore = {
  activeTab: Tab
  /** null = check still running */
  storagePersisted: boolean | null
  setActiveTab: (tab: Tab) => void
  setStoragePersisted: (granted: boolean) => void
}

export const useUiStore = create<UiStore>()((set) => ({
  activeTab: 'dashboard',
  storagePersisted: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setStoragePersisted: (granted) => set({ storagePersisted: granted }),
}))
