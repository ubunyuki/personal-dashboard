import { LayoutDashboard, ListTodo, StickyNote } from 'lucide-react'
import { useUiStore, type Tab } from '../../store/uiStore'
import { Clock } from './Clock'
import { QuickActions } from './QuickActions'
import { ThemeToggle } from './ThemeToggle'

const tabs: Array<{ id: Tab; label: string; Icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', Icon: ListTodo },
  { id: 'notes', label: 'Notes', Icon: StickyNote },
]

export function StatusBar() {
  const active = useUiStore((s) => s.activeTab)
  const setActiveTab = useUiStore((s) => s.setActiveTab)
  return (
    <header className="flex h-11 shrink-0 items-center gap-1 border-b border-slate-200 bg-white/85 px-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
      <span className="pr-2 pl-1 text-sm font-semibold tracking-tight select-none">WorkDesk</span>
      <nav className="flex items-center gap-1">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm ${
              active === id
                ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon size={15} strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2 pr-1">
        <QuickActions />
        <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <ThemeToggle />
        <Clock />
      </div>
    </header>
  )
}
