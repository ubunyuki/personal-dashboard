import { StatusBar } from './features/statusbar/StatusBar'
import { WhiteboardOverlay } from './features/whiteboard/WhiteboardOverlay'
import { CommandPalette } from './features/palette/CommandPalette'
import { ReviewDrawer } from './features/review/ReviewDrawer'
import { CalendarPopover } from './features/statusbar/CalendarPopover'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { TasksPage } from './features/tasks/TasksPage'
import { NotesPage } from './features/notes/NotesPage'
import { BookmarksPage } from './features/bookmarks/BookmarksPage'
import { TaskEditor } from './features/tasks/TaskEditor'
import { SettingsModal } from './features/settings/SettingsModal'
import { HelpModal } from './features/help/HelpModal'
import { RestorePrompt } from './features/settings/RestorePrompt'
import { BackupBanner } from './features/settings/BackupBanner'
import { useUiStore } from './store/uiStore'
import { useThemeEffect } from './lib/theme'
import { usePwaUpdatePoll } from './lib/usePwaUpdatePoll'
import { useShortcuts } from './lib/useShortcuts'

export default function App() {
  useThemeEffect()
  usePwaUpdatePoll()
  useShortcuts()
  const tab = useUiStore((s) => s.activeTab)
  const persisted = useUiStore((s) => s.storagePersisted)
  const editingTask = useUiStore((s) => s.editingTask)
  const settingsOpen = useUiStore((s) => s.settingsOpen)
  const helpOpen = useUiStore((s) => s.helpOpen)
  const restorePrompt = useUiStore((s) => s.restorePrompt)
  const paletteOpen = useUiStore((s) => s.paletteOpen)
  const reviewOpen = useUiStore((s) => s.reviewOpen)
  return (
    <div className="flex h-full min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <StatusBar />
      <BackupBanner />
      <main className="flex-1 overflow-y-auto">
        {tab === 'dashboard' && <DashboardPage />}
        {tab === 'tasks' && <TasksPage />}
        {tab === 'notes' && <NotesPage />}
        {tab === 'bookmarks' && <BookmarksPage />}
      </main>
      <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 px-3 py-1 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-600">
        <span>build {__BUILD_ID__}</span>
        <span>
          {persisted === null
            ? 'storage: checking…'
            : persisted
              ? 'storage: persistent'
              : 'storage: best-effort — install as app to protect data'}
        </span>
      </footer>
      <CalendarPopover />
      <WhiteboardOverlay />
      {editingTask !== null && <TaskEditor key={editingTask} />}
      {settingsOpen && <SettingsModal />}
      {helpOpen && <HelpModal />}
      {restorePrompt !== null && <RestorePrompt />}
      {paletteOpen && <CommandPalette />}
      {reviewOpen && <ReviewDrawer />}
    </div>
  )
}
