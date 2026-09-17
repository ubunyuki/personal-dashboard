import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { metrics as computeMetrics, type Metrics } from '../../store/selectors'
import { Card, cardTitleCls, type CardAccent } from '../../components/ui/Card'
import { useNow } from '../../lib/useNow'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

function Tile({
  label,
  value,
  accent,
  onClick,
}: {
  label: string
  value: number
  accent: CardAccent
  onClick: () => void
}) {
  return (
    <Card accent={accent} onClick={onClick}>
      <span className={`block text-2xl font-semibold tabular-nums ${cardTitleCls[accent]}`}>
        {value}
      </span>
      <span className="flex items-center gap-0.5 text-xs text-slate-500 dark:text-slate-400">
        {label}
        <ChevronRight size={12} className="shrink-0" />
      </span>
    </Card>
  )
}

export function MetricTiles({ metrics }: { metrics: Metrics }) {
  const openReview = useUiStore((s) => s.openReview)
  const openTasksWith = useUiStore((s) => s.openTasksWith)
  return (
    // Four across only from md up: on a phone they would be too narrow to
    // read the labels.
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Tile
        label="Open tasks"
        value={metrics.open}
        accent="tasks"
        onClick={() => openTasksWith({ status: 'open' })}
      />
      <Tile
        label="Overdue"
        value={metrics.overdue}
        // A red card reading "0" would be a false alarm — the tint is the
        // alert, so it only appears when there is something to alert about.
        accent={metrics.overdue > 0 ? 'overdue' : 'neutral'}
        onClick={() => openTasksWith({ status: 'open', due: 'overdue' })}
      />
      <Tile
        label="Due this week"
        value={metrics.dueThisWeek}
        accent="bookmarks"
        onClick={() => openTasksWith({ status: 'open', due: 'calendarWeek' })}
      />
      <Tile
        label="Done this week"
        value={metrics.doneThisWeek}
        accent="notes"
        onClick={openReview}
      />
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
