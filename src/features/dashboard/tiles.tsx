import { useMemo, type ComponentType } from 'react'
import type { TileId } from '../../types'
import { useNow } from '../../lib/useNow'
import { useAppStore } from '../../store/appStore'
import { metrics, taskBuckets } from '../../store/selectors'
import { BusTile } from './BusTile'
import { MetricTiles } from './MetricTiles'
import { PinnedNotes } from './PinnedNotes'
import { RecentBookmarks } from './RecentBookmarks'
import { RecentNotes } from './RecentNotes'
import { TaskBucketWidget } from './TaskBucketWidget'
import { UpcomingEvents } from './UpcomingEvents'

/**
 * Every tile the dashboard can render. Each one pulls its own data, so
 * DashboardPage is a pure mapper over the saved layout and a tile can be
 * hidden or moved without threading props around.
 *
 * `span` is what keeps the grid packing sensibly under any order: full-width
 * tiles claim both columns, half-width ones pair up with whatever follows.
 */
export interface TileDef {
  /** Shown in the edit-mode control strip — the tile's own header may be
   *  absent (metrics) or dynamic, so the label is stated here. */
  label: string
  span: 'full' | 'half'
  Component: ComponentType
}

function MetricsTile() {
  const tasks = useAppStore((s) => s.tasks)
  const weekStartsOn = useAppStore((s) => s.settings.weekStartsOn)
  const now = useNow()
  const m = useMemo(() => metrics(tasks, now, weekStartsOn), [tasks, now, weekStartsOn])
  return <MetricTiles metrics={m} />
}

function TaskBucketsTile() {
  const tasks = useAppStore((s) => s.tasks)
  const now = useNow()
  const buckets = useMemo(() => taskBuckets(tasks, now), [tasks, now])
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <TaskBucketWidget title="Overdue" tasks={buckets.overdue} now={now} emptyText="Nothing overdue." />
      <TaskBucketWidget title="Due today" tasks={buckets.dueToday} now={now} emptyText="Clear for today." />
      <TaskBucketWidget title="Due this week" tasks={buckets.dueWeek} now={now} emptyText="The week ahead is clear." />
      <TaskBucketWidget title="In progress" tasks={buckets.inProgress} now={now} emptyText="Nothing in flight." />
    </div>
  )
}

/** Record, not a list: TypeScript then fails the build if TileId gains a
 *  member without a tile to render it. Display order lives in TILE_ORDER. */
export const TILE_REGISTRY: Record<TileId, TileDef> = {
  metrics: { label: 'Metrics', span: 'full', Component: MetricsTile },
  pinnedNotes: { label: 'Pinned notes', span: 'full', Component: PinnedNotes },
  buckets: { label: 'Task buckets', span: 'full', Component: TaskBucketsTile },
  events: { label: 'Upcoming events', span: 'half', Component: UpcomingEvents },
  notes: { label: 'Recent notes', span: 'half', Component: RecentNotes },
  bookmarks: { label: 'Bookmarks', span: 'half', Component: RecentBookmarks },
  bus: { label: 'Bus arrivals', span: 'half', Component: BusTile },
}
