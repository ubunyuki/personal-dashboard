import { CloudAlert } from 'lucide-react'
import { iconFor, labelFor, warningSettings } from '../../lib/weather/warnings'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import { useWarningStore } from '../../store/warningStore'

/** Status-bar HKO warnings: the official icons, worst signal first. Absent
 *  entirely when nothing is hoisted — which is almost every day, and is what
 *  keeps a quiet bar quiet. Click opens <WarningPanel>. */
export function WarningChip() {
  const weather = useAppStore((s) => s.settings.weather)
  const toggleWarningPanel = useUiStore((s) => s.toggleWarningPanel)
  const snapshot = useWarningStore((s) => s.snapshot)

  if (!warningSettings(weather).enabled) return null
  const warnings = snapshot?.warnings ?? []
  const tips = snapshot?.tips ?? []
  if (warnings.length === 0 && tips.length === 0) return null

  // A tip is a pre-announcement, not a hoisted signal — softer styling so the
  // two are never confused. Hoisted signals win the styling when both are up.
  const hoisted = warnings.length > 0
  const title = hoisted
    ? warnings.map(labelFor).join(' · ')
    : (tips[0]?.desc ?? 'Special Weather Tip')

  return (
    <button
      type="button"
      onClick={toggleWarningPanel}
      title={title}
      className={`flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 ${
        hoisted
          ? 'bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900'
          : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900'
      }`}
    >
      {hoisted ? (
        warnings.slice(0, 3).map((w) => {
          const src = iconFor(w)
          return src ? (
            <img key={w.statement} src={src} alt={labelFor(w)} className="h-4 w-4 object-contain" />
          ) : (
            <CloudAlert
              key={w.statement}
              size={16}
              strokeWidth={1.75}
              className="text-red-600 dark:text-red-400"
            />
          )
        })
      ) : (
        <CloudAlert size={16} strokeWidth={1.75} className="text-amber-600 dark:text-amber-400" />
      )}
      {!hoisted && (
        <span className="hidden text-xs font-medium text-amber-700 sm:inline dark:text-amber-300">
          Expected
        </span>
      )}
    </button>
  )
}
