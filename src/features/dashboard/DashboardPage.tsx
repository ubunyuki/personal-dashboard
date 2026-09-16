import { useMemo } from 'react'
import { useNow } from '../../lib/useNow'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import { metrics, taskBuckets } from '../../store/selectors'
import { MetricTiles } from './MetricTiles'
import { PinnedNotes } from './PinnedNotes'
import { RecentBookmarks } from './RecentBookmarks'
import { RecentNotes } from './RecentNotes'
import { TaskBucketWidget } from './TaskBucketWidget'
import { UpcomingEvents } from './UpcomingEvents'

export function DashboardPage() {
  const tasks = useAppStore((s) => s.tasks)
  const notesCount = useAppStore((s) => s.notes.length)
  const openRestorePrompt = useUiStore((s) => s.openRestorePrompt)
  const weekStartsOn = useAppStore((s) => s.settings.weekStartsOn)
  const now = useNow()
  const buckets = useMemo(() => taskBuckets(tasks, now), [tasks, now])
  const m = useMemo(() => metrics(tasks, now, weekStartsOn), [tasks, now, weekStartsOn])
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4">
      <MetricTiles metrics={m} />
      {tasks.length === 0 && notesCount === 0 && (
        <button
          type="button"
          onClick={() => openRestorePrompt('import')}
          className="self-start rounded-md px-1 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
        >
          New machine or cleared browser? Restore from a backup file →
        </button>
      )}
      {/* Full width and above the buckets: a pinned note is there to be read,
          and the tile renders nothing at all while nothing is pinned. */}
      <PinnedNotes />
      <div className="grid gap-3 md:grid-cols-2">
        <TaskBucketWidget title="Overdue" tasks={buckets.overdue} now={now} emptyText="Nothing overdue." />
        <TaskBucketWidget title="Due today" tasks={buckets.dueToday} now={now} emptyText="Clear for today." />
        <TaskBucketWidget title="Due this week" tasks={buckets.dueWeek} now={now} emptyText="The week ahead is clear." />
        <TaskBucketWidget title="In progress" tasks={buckets.inProgress} now={now} emptyText="Nothing in flight." />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <UpcomingEvents />
        <RecentNotes />
        <RecentBookmarks />
      </div>
    </div>
  )
}
