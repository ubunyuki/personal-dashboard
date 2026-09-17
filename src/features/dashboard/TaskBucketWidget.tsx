import { useMemo } from 'react'
import type { Task } from '../../types'
import { Card, cardTitleCls, type CardAccent } from '../../components/ui/Card'
import { useNow } from '../../lib/useNow'
import { useAppStore } from '../../store/appStore'
import { taskBuckets } from '../../store/selectors'
import { useUiStore } from '../../store/uiStore'
import { TaskRow } from '../tasks/TaskRow'

export function TaskBucketWidget({
  title,
  tasks,
  now,
  emptyText,
  accent = 'tasks',
}: {
  title: string
  tasks: Task[]
  now: Date
  emptyText: string
  /** Urgency of the bucket — 'overdue' and 'dueToday' tint the whole card. */
  accent?: CardAccent
}) {
  const setActiveTab = useUiStore((s) => s.setActiveTab)
  return (
    <Card accent={accent} title={title} right={tasks.length}>
      {tasks.length === 0 ? (
        <p className="py-2 text-sm text-slate-400 dark:text-slate-500">{emptyText}</p>
      ) : (
        <div className="flex flex-col">
          {tasks.slice(0, 6).map((t) => (
            <TaskRow key={t.id} task={t} now={now} />
          ))}
          {tasks.length > 6 && (
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              // Neutral hover wash rather than a per-accent one: it reads on
              // any card tint, the same trick tintedIconBtnCls uses.
              className={`mt-1 self-start rounded-md px-2 py-0.5 text-xs hover:bg-black/5 dark:hover:bg-white/10 ${cardTitleCls[accent]}`}
            >
              View all {tasks.length} →
            </button>
          )}
        </div>
      )}
    </Card>
  )
}

/** The dashboard's task buckets, narrowed to what actually demands a decision
 *  today: what is late, what is due, what is already underway. "Due this week"
 *  used to sit here too, but four cards of mostly-future work buried the two
 *  that matter — the week ahead now lives in the metrics strip instead. */
export function TaskBucketsTile() {
  const tasks = useAppStore((s) => s.tasks)
  const now = useNow()
  const buckets = useMemo(() => taskBuckets(tasks, now), [tasks, now])
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <TaskBucketWidget
        title="Overdue"
        accent="overdue"
        tasks={buckets.overdue}
        now={now}
        emptyText="Nothing overdue."
      />
      <TaskBucketWidget
        title="Due today"
        accent="dueToday"
        tasks={buckets.dueToday}
        now={now}
        emptyText="Clear for today."
      />
      <TaskBucketWidget
        title="In progress"
        tasks={buckets.inProgress}
        now={now}
        emptyText="Nothing in flight."
      />
    </div>
  )
}
