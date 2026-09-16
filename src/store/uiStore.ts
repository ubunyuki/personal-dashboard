import { create } from 'zustand'

export type Tab = 'dashboard' | 'tasks' | 'notes' | 'bookmarks' | 'bus'

export type BackupMode = 'unconfigured' | 'auto' | 'permission-needed' | 'blocked' | 'error'

export interface BackupStatus {
  mode: BackupMode
  lastBackupAt: string | null
}

type UiState = {
  activeTab: Tab
  /** null = check still running */
  storagePersisted: boolean | null
  /** task id being edited, 'new' for a fresh task, null = editor closed */
  editingTask: string | 'new' | null
  settingsOpen: boolean
  helpOpen: boolean
  /** Bumped to tell the notes capture box to grab focus. */
  noteFocusToken: number
  /** Bumped to tell the bookmarks page to focus its add-link box. */
  bookmarkFocusToken: number
  /** Unsaved capture-box draft; survives tab switches (not reloads). */
  noteDraft: string
  backup: BackupStatus
  restorePrompt: 'tripwire' | 'import' | null
  bellOpen: boolean
  calendar: { open: boolean; date: string | null }
  weatherMenuOpen: boolean
  warningPanelOpen: boolean
  whiteboardOpen: boolean
  paletteOpen: boolean
  reviewOpen: boolean
  /** Note to scroll into view + highlight after a palette jump. */
  noteFocusId: string | null
}

type UiStore = UiState & {
  setActiveTab: (tab: Tab) => void
  setStoragePersisted: (granted: boolean) => void
  openTaskEditor: (id?: string) => void
  closeTaskEditor: () => void
  openSettings: () => void
  closeSettings: () => void
  openHelp: () => void
  closeHelp: () => void
  focusNoteCapture: () => void
  focusBookmarks: () => void
  setNoteDraft: (text: string) => void
  setBackupStatus: (status: BackupStatus) => void
  openRestorePrompt: (kind: 'tripwire' | 'import') => void
  closeRestorePrompt: () => void
  toggleBell: () => void
  closeBell: () => void
  toggleCalendar: () => void
  openCalendar: (date?: string) => void
  closeCalendar: () => void
  toggleWeatherMenu: () => void
  closeWeatherMenu: () => void
  toggleWarningPanel: () => void
  closeWarningPanel: () => void
  openWhiteboard: () => void
  closeWhiteboard: () => void
  togglePalette: () => void
  closePalette: () => void
  openReview: () => void
  closeReview: () => void
  /** Jump to a note: switches to the Notes tab and marks it for highlight. */
  focusNote: (id: string) => void
  clearNoteFocus: () => void
}

/** Initial UI state — exported so tests can reset the store between cases. */
export const initialUiState = (): UiState => ({
  activeTab: 'dashboard',
  storagePersisted: null,
  editingTask: null,
  settingsOpen: false,
  helpOpen: false,
  noteFocusToken: 0,
  bookmarkFocusToken: 0,
  noteDraft: '',
  backup: { mode: 'unconfigured', lastBackupAt: null },
  restorePrompt: null,
  bellOpen: false,
  calendar: { open: false, date: null },
  weatherMenuOpen: false,
  warningPanelOpen: false,
  whiteboardOpen: false,
  paletteOpen: false,
  reviewOpen: false,
  noteFocusId: null,
})

export const useUiStore = create<UiStore>()((set) => ({
  ...initialUiState(),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setStoragePersisted: (granted) => set({ storagePersisted: granted }),
  openTaskEditor: (id) => set({ editingTask: id ?? 'new' }),
  closeTaskEditor: () => set({ editingTask: null }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  openHelp: () => set({ helpOpen: true }),
  closeHelp: () => set({ helpOpen: false }),
  focusNoteCapture: () => set((s) => ({ activeTab: 'notes', noteFocusToken: s.noteFocusToken + 1 })),
  focusBookmarks: () =>
    set((s) => ({ activeTab: 'bookmarks', bookmarkFocusToken: s.bookmarkFocusToken + 1 })),
  setNoteDraft: (text) => set({ noteDraft: text }),
  setBackupStatus: (status) => set({ backup: status }),
  openRestorePrompt: (kind) => set({ restorePrompt: kind, settingsOpen: false }),
  closeRestorePrompt: () => set({ restorePrompt: null }),
  // The status-bar popovers (bell, calendar, weather menu, warning panel)
  // are mutually exclusive — opening one closes the others.
  toggleBell: () =>
    set((s) => ({
      bellOpen: !s.bellOpen,
      weatherMenuOpen: false,
      warningPanelOpen: false,
      calendar: { ...s.calendar, open: false },
    })),
  closeBell: () => set({ bellOpen: false }),
  toggleCalendar: () =>
    set((s) =>
      s.calendar.open
        ? { calendar: { ...s.calendar, open: false } }
        : {
            calendar: { open: true, date: null },
            bellOpen: false,
            weatherMenuOpen: false,
            warningPanelOpen: false,
          },
    ),
  openCalendar: (date) =>
    set({
      calendar: { open: true, date: date ?? null },
      bellOpen: false,
      weatherMenuOpen: false,
      warningPanelOpen: false,
    }),
  closeCalendar: () => set((s) => ({ calendar: { ...s.calendar, open: false } })),
  toggleWeatherMenu: () =>
    set((s) => ({
      weatherMenuOpen: !s.weatherMenuOpen,
      bellOpen: false,
      warningPanelOpen: false,
      calendar: { ...s.calendar, open: false },
    })),
  closeWeatherMenu: () => set({ weatherMenuOpen: false }),
  toggleWarningPanel: () =>
    set((s) => ({
      warningPanelOpen: !s.warningPanelOpen,
      bellOpen: false,
      weatherMenuOpen: false,
      calendar: { ...s.calendar, open: false },
    })),
  closeWarningPanel: () => set({ warningPanelOpen: false }),
  openWhiteboard: () =>
    set((s) => ({
      whiteboardOpen: true,
      bellOpen: false,
      weatherMenuOpen: false,
      warningPanelOpen: false,
      calendar: { ...s.calendar, open: false },
    })),
  closeWhiteboard: () => set({ whiteboardOpen: false }),
  // The palette closes the status-bar popovers on open, like they close
  // each other. Query/selection live in the component (reset on unmount).
  togglePalette: () =>
    set((s) => ({
      paletteOpen: !s.paletteOpen,
      bellOpen: false,
      weatherMenuOpen: false,
      warningPanelOpen: false,
      calendar: { ...s.calendar, open: false },
    })),
  closePalette: () => set({ paletteOpen: false }),
  openReview: () =>
    set((s) => ({
      reviewOpen: true,
      paletteOpen: false,
      bellOpen: false,
      weatherMenuOpen: false,
      warningPanelOpen: false,
      calendar: { ...s.calendar, open: false },
    })),
  closeReview: () => set({ reviewOpen: false }),
  focusNote: (id) => set({ activeTab: 'notes', noteFocusId: id }),
  clearNoteFocus: () => set({ noteFocusId: null }),
}))
