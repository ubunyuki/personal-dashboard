import { ChevronRight } from 'lucide-react'
import type { Metrics } from '../../store/selectors'
import { Card } from '../../components/ui/Card'
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
