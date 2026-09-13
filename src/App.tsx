import { StatusBar } from './features/statusbar/StatusBar'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { TasksPage } from './features/tasks/TasksPage'
import { NotesPage } from './features/notes/NotesPage'
import { TaskEditor } from './features/tasks/TaskEditor'
import { useUiStore } from './store/uiStore'
import { useThemeEffect } from './lib/theme'

export default function App() {
  useThemeEffect()
  const tab = useUiStore((s) => s.activeTab)
  const persisted = useUiStore((s) => s.storagePersisted)
  const editingTask = useUiStore((s) => s.editingTask)
  return (
    <div className="flex h-full min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <StatusBar />
      <main className="flex-1 overflow-y-auto">
        {tab === 'dashboard' && <DashboardPage />}
        {tab === 'tasks' && <TasksPage />}
        {tab === 'notes' && <NotesPage />}
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
      {editingTask !== null && <TaskEditor key={editingTask} />}
    </div>
  )
}
