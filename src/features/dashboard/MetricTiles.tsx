import type { Metrics } from '../../store/selectors'

function Tile({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <p
        className={`text-2xl font-semibold tabular-nums ${
          alert && value > 0 ? 'text-red-600 dark:text-red-400' : ''
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}

export function MetricTiles({ metrics }: { metrics: Metrics }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Tile label="Open tasks" value={metrics.open} />
      <Tile label="Done this week" value={metrics.doneThisWeek} />
      <Tile label="Overdue" value={metrics.overdue} alert />
    </div>
  )
}
