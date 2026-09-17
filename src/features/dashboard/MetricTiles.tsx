import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { metrics as computeMetrics, type Metrics } from '../../store/selectors'
import { Card } from '../../components/ui/Card'
import { useNow } from '../../lib/useNow'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

function Tile({
  label,
  value,
  alert,
  onClick,
}: {
  label: string
  value: number
  alert?: boolean
  onClick?: () => void
}) {
  return (
    <Card accent="neutral" onClick={onClick}>
      <span
        className={`block text-2xl font-semibold tabular-nums ${
          alert && value > 0 ? 'text-red-600 dark:text-red-400' : ''
        }`}
      >
        {value}
      </span>
      <span className="flex items-center gap-0.5 text-xs text-slate-500 dark:text-slate-400">
        {label}
        {onClick && <ChevronRight size={12} className="shrink-0" />}
      </span>
    </Card>
  )
}

export function MetricTiles({ metrics }: { metrics: Metrics }) {
  const openReview = useUiStore((s) => s.openReview)
  return (
    <div className="grid grid-cols-3 gap-3">
      <Tile label="Open tasks" value={metrics.open} />
      <Tile label="Done this week" value={metrics.doneThisWeek} onClick={openReview} />
      <Tile label="Overdue" value={metrics.overdue} alert />
    </div>
  )
}

/** Dashboard entry point: the tile registry renders this, MetricTiles above
 *  stays a pure view of a Metrics value. */
export function MetricsTile() {
  const tasks = useAppStore((s) => s.tasks)
  const weekStartsOn = useAppStore((s) => s.settings.weekStartsOn)
  const now = useNow()
  const m = useMemo(() => computeMetrics(tasks, now, weekStartsOn), [tasks, now, weekStartsOn])
  return <MetricTiles metrics={m} />
}
