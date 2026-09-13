import { NotebookPen, Plus, Settings } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'

export const iconBtnCls =
  'rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'

export function QuickActions() {
  const focusNoteCapture = useUiStore((s) => s.focusNoteCapture)
  const openTaskEditor = useUiStore((s) => s.openTaskEditor)
  const openSettings = useUiStore((s) => s.openSettings)
  return (
    <div className="flex items-center gap-0.5">
      <button type="button" title="New note" className={iconBtnCls} onClick={focusNoteCapture}>
        <NotebookPen size={16} strokeWidth={1.75} />
      </button>
      <button type="button" title="New task" className={iconBtnCls} onClick={() => openTaskEditor()}>
        <Plus size={16} strokeWidth={1.75} />
      </button>
      <button type="button" title="Settings" className={iconBtnCls} onClick={openSettings}>
        <Settings size={16} strokeWidth={1.75} />
      </button>
    </div>
  )
}
