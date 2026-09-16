import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import type { CalEvent, Task } from '../../types'
import { DATE_FMT, parseLocalDate, toLocalDate } from '../../lib/dates/dates'

export interface ReviewWeek {
  /** Local calendar bounds, inclusive, 'yyyy-MM-dd'. */
  start: string
  end: string
  /** "14–20 Sep 2026", collapsing a shared month and year. */
  label: string
}

function rangeLabel(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear()
  if (sameYear && start.getMonth() === end.getMonth()) {
    return `${format(start, 'd')}–${format(end, 'd MMM yyyy')}`
  }
  if (sameYear) return `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`
  return `${format(start, 'd MMM yyyy')} – ${format(end, 'd MMM yyyy')}`
}

/** `offset` is in weeks: 0 = the week containing `now`, -1 = the one before. */
export function weekRange(now: Date, offset: number, weekStartsOn: 0 | 1 = 1): ReviewWeek {
  const start = startOfWeek(addDays(now, offset * 7), { weekStartsOn })
  const end = addDays(start, 6)
  return { start: toLocalDate(start), end: toLocalDate(end), label: rangeLabel(start, end) }
}

export interface ReviewItem {
  id: string
  title: string
  project?: string
  /** Local 'yyyy-MM-dd' the task was completed on. */
  day: string
}

export interface ReviewDayGroup {
  day: string
  /** "Mon 14 Sep" */
  label: string
  items: ReviewItem[]
}

export interface ReviewProjectGroup {
  /** null = the untagged bucket, always sorted last. */
  project: string | null
  items: ReviewItem[]
}

export interface ReviewData {
  byDay: ReviewDayGroup[]
  byProject: ReviewProjectGroup[]
  events: CalEvent[]
  taskCount: number
  eventCount: number
}

/**
 * completedAt is an ISO UTC instant; the week is a LOCAL calendar range. Bucket
 * through parseISO + format so a 07:00 Hong Kong completion — 23:00 UTC the
 * previous day — files under the local day the work actually happened on.
 * Never `completedAt.slice(0, 10)`.
 */
export function buildReview(tasks: Task[], events: CalEvent[], week: ReviewWeek): ReviewData {
  const done: Array<{ item: ReviewItem; at: string }> = []
  for (const t of tasks) {
    if (t.status !== 'done' || !t.completedAt) continue
    const day = format(parseISO(t.completedAt), DATE_FMT)
    if (day < week.start || day > week.end) continue
    done.push({ item: { id: t.id, title: t.title, project: t.project, day }, at: t.completedAt })
  }
  done.sort((a, b) => a.at.localeCompare(b.at))
  const items = done.map((d) => d.item)

  const byDay: ReviewDayGroup[] = []
  for (const item of items) {
    const last = byDay[byDay.length - 1]
    if (last && last.day === item.day) last.items.push(item)
    else
      byDay.push({
        day: item.day,
        label: format(parseLocalDate(item.day), 'EEE d MMM'),
        items: [item],
      })
  }

  const buckets = new Map<string, ReviewItem[]>()
  for (const item of items) {
    const key = item.project ?? ''
    const bucket = buckets.get(key)
    if (bucket) bucket.push(item)
    else buckets.set(key, [item])
  }
  const byProject: ReviewProjectGroup[] = [...buckets.entries()]
    .map(([key, list]) => ({ project: key === '' ? null : key, items: list }))
    .sort((a, b) => {
      if (a.project === null) return 1
      if (b.project === null) return -1
      return a.project.localeCompare(b.project)
    })

  const inWeek = events
    .filter((e) => e.date >= week.start && e.date <= week.end)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))

  return {
    byDay,
    byProject,
    events: inWeek,
    taskCount: items.length,
    eventCount: inWeek.length,
  }
}

export interface MarkdownOptions {
  groupBy: 'day' | 'project'
  includeEvents: boolean
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Standup-ready markdown: one heading per day (or project), then a tally. */
export function reviewToMarkdown(
  data: ReviewData,
  week: ReviewWeek,
  { groupBy, includeEvents }: MarkdownOptions,
): string {
  const lines: string[] = [`## Week of ${week.label}`, '']

  if (data.taskCount === 0) {
    lines.push('_Nothing completed this week._', '')
  } else if (groupBy === 'day') {
    for (const group of data.byDay) {
      lines.push(`### ${group.label}`)
      for (const item of group.items) {
        lines.push(`- ${item.title}${item.project ? `  \`#${item.project}\`` : ''}`)
      }
      lines.push('')
    }
  } else {
    for (const group of data.byProject) {
      lines.push(`### ${group.project ? `#${group.project}` : 'No project'}`)
      for (const item of group.items) {
        lines.push(`- ${item.title} — ${format(parseLocalDate(item.day), 'EEE d MMM')}`)
      }
      lines.push('')
    }
  }

  if (includeEvents && data.eventCount > 0) {
    lines.push('### Events')
    for (const e of data.events) {
      lines.push(
        `- ${format(parseLocalDate(e.date), 'EEE d MMM')}${e.time ? ` ${e.time}` : ''} — ${e.title}`,
      )
    }
    lines.push('')
  }

  const tally = [plural(data.taskCount, 'task', 'tasks') + ' completed']
  if (includeEvents) tally.push(plural(data.eventCount, 'event', 'events'))
  lines.push(`_${tally.join(' · ')}_`)
  return lines.join('\n')
}
