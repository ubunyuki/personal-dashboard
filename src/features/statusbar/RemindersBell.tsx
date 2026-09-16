import { useMemo } from 'react'
import { Bell } from 'lucide-react'
import { useNow } from '../../lib/useNow'
import { deriveReminders } from '../../lib/dates/reminders'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import { iconBtnCls } from './QuickActions'

/** Bell + unread badge. The dropdown it opens is <RemindersPanel>, rendered
 *  from App so the status bar cannot clip it. */
export function RemindersBell() {
  const toggleBell = useUiStore((s) => s.toggleBell)
  const tasks = useAppStore((s) => s.tasks)
  const events = useAppStore((s) => s.events)
  const now = useNow()
  const count = useMemo(() => deriveReminders(tasks, events, now).count, [tasks, events, now])

  return (
    <button type="button" title="Reminders" onClick={toggleBell} className={`relative ${iconBtnCls}`}>
      <Bell size={16} strokeWidth={1.75} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-semibold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}
