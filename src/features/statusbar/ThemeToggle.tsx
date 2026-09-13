import { Monitor, Moon, Sun } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import type { Settings } from '../../types'

const order: Array<Settings['theme']> = ['system', 'light', 'dark']
const icons = { system: Monitor, light: Sun, dark: Moon } as const

export function ThemeToggle() {
  const theme = useAppStore((s) => s.settings.theme)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const next = order[(order.indexOf(theme) + 1) % order.length]
  const Icon = icons[theme]
  return (
    <button
      type="button"
      onClick={() => updateSettings({ theme: next })}
      title={`Theme: ${theme} — click for ${next}`}
      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
    >
      <Icon size={16} strokeWidth={1.75} />
    </button>
  )
}
