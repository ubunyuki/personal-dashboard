import { describe, expect, it } from 'vitest'
import type { CalEvent, Task } from '../../types'
import { buildReview, reviewToMarkdown, weekRange } from './review'

// 2026-09-14 is a Monday, so week 0 of a "now" inside it is 14–20 Sep.
const NOW = new Date('2026-09-16T12:00:00+08:00')

let n = 0
/**
 * `local` is a wall-clock moment written with its offset, but it is STORED the
 * way the app stores it — nowIso() is new Date().toISOString(), so completedAt
 * is always a Z-suffixed UTC instant. That gap is the whole point of these tests.
 */
const doneAt = (title: string, local: string, project?: string): Task => {
  const completedAt = new Date(local).toISOString()
  return {
    id: `t${++n}`,
    title,
    description: '',
    status: 'done',
    priority: 'medium',
    project,
    completedAt,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: completedAt,
  }
}
const event = (title: string, date: string, time?: string): CalEvent => ({
  id: `e${++n}`,
  title,
  date,
  time,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
})

describe('weekRange', () => {
  it('spans Monday to Sunday around now', () => {
    expect(weekRange(NOW, 0)).toMatchObject({ start: '2026-09-14', end: '2026-09-20' })
  })

  it('offsets whole weeks in both directions', () => {
    expect(weekRange(NOW, -1).start).toBe('2026-09-07')
    expect(weekRange(NOW, 1).start).toBe('2026-09-21')
  })

  it('collapses the label when month and year are shared', () => {
    expect(weekRange(NOW, 0).label).toBe('14–20 Sep 2026')
    // Crossing a month keeps both month names…
    expect(weekRange(NOW, 2).label).toBe('28 Sep – 4 Oct 2026')
    // …and crossing a year keeps both years.
    expect(weekRange(new Date('2025-12-31T12:00:00+08:00'), 0).label).toBe(
      '29 Dec 2025 – 4 Jan 2026',
    )
  })
})

describe('buildReview', () => {
  it('buckets completions by LOCAL day, not the UTC date string', () => {
    // Guard: the suite pins TZ=Asia/Hong_Kong (vite.config.ts), so this case
    // means the same thing on a UTC CI box as on the dev machine.
    expect(new Date('2026-09-14T00:00:00+08:00').getTimezoneOffset()).toBe(-480)

    // 07:00 Monday in Hong Kong is 23:00 UTC the SUNDAY BEFORE — so a naive
    // completedAt.slice(0, 10) both mislabels the day and drops the task out
    // of the week entirely.
    const t = doneAt('Early start', '2026-09-14T07:00:00+08:00')
    expect(t.completedAt).toBe('2026-09-13T23:00:00.000Z')
    expect(t.completedAt!.slice(0, 10)).toBe('2026-09-13')

    const week = weekRange(NOW, 0)
    const data = buildReview([t], [], week)
    expect(data.taskCount).toBe(1)
    expect(data.byDay).toHaveLength(1)
    expect(data.byDay[0].day).toBe('2026-09-14')
    expect(data.byDay[0].label).toBe('Mon 14 Sep')
  })

  it('keeps only done tasks that carry a completedAt inside the week', () => {
    const week = weekRange(NOW, 0)
    const inWeek = doneAt('In week', '2026-09-15T10:00:00+08:00')
    const lastWeek = doneAt('Last week', '2026-09-10T10:00:00+08:00')
    const open: Task = { ...doneAt('Still open', '2026-09-15T10:00:00+08:00'), status: 'todo' }
    const noStamp: Task = {
      ...doneAt('No stamp', '2026-09-15T10:00:00+08:00'),
      completedAt: undefined,
    }

    const data = buildReview([inWeek, lastWeek, open, noStamp], [], week)
    expect(data.byDay.flatMap((d) => d.items.map((i) => i.title))).toEqual(['In week'])
  })

  it('orders days chronologically and items by completion time', () => {
    const week = weekRange(NOW, 0)
    const data = buildReview(
      [
        doneAt('Tuesday second', '2026-09-15T16:00:00+08:00'),
        doneAt('Monday only', '2026-09-14T09:00:00+08:00'),
        doneAt('Tuesday first', '2026-09-15T09:00:00+08:00'),
      ],
      [],
      week,
    )
    expect(data.byDay.map((d) => d.day)).toEqual(['2026-09-14', '2026-09-15'])
    expect(data.byDay[1].items.map((i) => i.title)).toEqual(['Tuesday first', 'Tuesday second'])
  })

  it('groups by project alphabetically with the untagged bucket last', () => {
    const week = weekRange(NOW, 0)
    const data = buildReview(
      [
        doneAt('Loose end', '2026-09-15T09:00:00+08:00'),
        doneAt('Ship it', '2026-09-15T10:00:00+08:00', 'reporting'),
        doneAt('Tweak nav', '2026-09-15T11:00:00+08:00', 'design'),
      ],
      [],
      week,
    )
    expect(data.byProject.map((g) => g.project)).toEqual(['design', 'reporting', null])
  })

  it('includes only events inside the week, date then time', () => {
    const week = weekRange(NOW, 0)
    const data = buildReview(
      [],
      [
        event('Late standup', '2026-09-15', '14:00'),
        event('Next week', '2026-09-22'),
        event('Early standup', '2026-09-15', '09:00'),
      ],
      week,
    )
    expect(data.events.map((e) => e.title)).toEqual(['Early standup', 'Late standup'])
    expect(data.eventCount).toBe(2)
  })
})

describe('reviewToMarkdown', () => {
  const week = weekRange(NOW, 0)
  const tasks = [
    doneAt('Ship the quarterly report', '2026-09-14T09:00:00+08:00', 'reporting'),
    doneAt('Loose end', '2026-09-15T09:00:00+08:00'),
  ]
  const events = [event('Team standup', '2026-09-15', '09:30')]

  it('renders day headings with tagged bullets and a tally', () => {
    const md = reviewToMarkdown(buildReview(tasks, events, week), week, {
      groupBy: 'day',
      includeEvents: false,
    })
    expect(md).toBe(
      [
        '## Week of 14–20 Sep 2026',
        '',
        '### Mon 14 Sep',
        '- Ship the quarterly report  `#reporting`',
        '',
        '### Tue 15 Sep',
        '- Loose end',
        '',
        '_2 tasks completed_',
      ].join('\n'),
    )
  })

  it('renders project headings with the day moved onto the bullet', () => {
    const md = reviewToMarkdown(buildReview(tasks, events, week), week, {
      groupBy: 'project',
      includeEvents: true,
    })
    expect(md).toContain('### #reporting\n- Ship the quarterly report — Mon 14 Sep')
    expect(md).toContain('### No project\n- Loose end — Tue 15 Sep')
    expect(md).toContain('### Events\n- Tue 15 Sep 09:30 — Team standup')
    expect(md.endsWith('_2 tasks completed · 1 event_')).toBe(true)
  })

  it('says so plainly when the week was empty', () => {
    const empty = weekRange(NOW, -4)
    const md = reviewToMarkdown(buildReview(tasks, events, empty), empty, {
      groupBy: 'day',
      includeEvents: true,
    })
    expect(md).toContain('_Nothing completed this week._')
    expect(md).toContain('_0 tasks completed · 0 events_')
  })
})
