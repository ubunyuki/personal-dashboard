import { StatusBar } from './features/statusbar/StatusBar'
import { WhiteboardOverlay } from './features/whiteboard/WhiteboardOverlay'
import { CommandPalette } from './features/palette/CommandPalette'
import { ReviewDrawer } from './features/review/ReviewDrawer'
import { CalendarPopover } from './features/statusbar/CalendarPopover'
import { RemindersPanel } from './features/statusbar/RemindersPanel'
import { WeatherMenu } from './features/statusbar/WeatherMenu'
import { WarningPanel } from './features/statusbar/WarningPanel'
import { WarningToast } from './features/statusbar/WarningToast'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { TasksPage } from './features/tasks/TasksPage'
import { NotesPage } from './features/notes/NotesPage'
import { BookmarksPage } from './features/bookmarks/BookmarksPage'
import { BusPage } from './features/bus/BusPage'
import { TaskEditor } from './features/tasks/TaskEditor'
import { SettingsModal } from './features/settings/SettingsModal'
import { HelpModal } from './features/help/HelpModal'
import { RestorePrompt } from './features/settings/RestorePrompt'
import { BackupBanner } from './features/settings/BackupBanner'
import { CoffeeLink } from './components/CoffeeLink'
import { useUiStore } from './store/uiStore'
import { useThemeEffect } from './lib/theme'
import { usePwaUpdatePoll } from './lib/usePwaUpdatePoll'
import { useShortcuts } from './lib/useShortcuts'
import { useWarningPoll } from './features/statusbar/useWarningPoll'

export default function App() {
  useThemeEffect()
  usePwaUpdatePoll()
  useShortcuts()
  useWarningPoll()
  const tab = useUiStore((s) => s.activeTab)
  const persisted = useUiStore((s) => s.storagePersisted)
  const editingTask = useUiStore((s) => s.editingTask)
  const settingsOpen = useUiStore((s) => s.settingsOpen)
  const helpOpen = useUiStore((s) => s.helpOpen)
  const restorePrompt = useUiStore((s) => s.restorePrompt)
  const paletteOpen = useUiStore((s) => s.paletteOpen)
  const reviewOpen = useUiStore((s) => s.reviewOpen)
  const bellOpen = useUiStore((s) => s.bellOpen)
  const weatherMenuOpen = useUiStore((s) => s.weatherMenuOpen)
  const warningPanelOpen = useUiStore((s) => s.warningPanelOpen)
  return (
    <div className="flex h-full min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <StatusBar />
      <BackupBanner />
      <main className="flex-1 overflow-y-auto">
        {tab === 'dashboard' && <DashboardPage />}
        {tab === 'tasks' && <TasksPage />}
        {tab === 'notes' && <NotesPage />}
        {tab === 'bookmarks' && <BookmarksPage />}
        {tab === 'bus' && <BusPage />}
      </main>
      <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 px-3 py-1 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-600">
        <span>build {__BUILD_ID__}</span>
        <CoffeeLink className="hover:text-slate-600 dark:hover:text-slate-300" />
        <span>
          {persisted === null
            ? 'storage: checking…'
            : persisted
              ? 'storage: persistent'
              : 'storage: best-effort — install as app to protect data'}
        </span>
      </footer>
      <CalendarPopover />
      {bellOpen && <RemindersPanel />}
      {weatherMenuOpen && <WeatherMenu />}
      {warningPanelOpen && <WarningPanel />}
      <WarningToast />
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
