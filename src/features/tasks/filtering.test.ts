import { describe, expect, it } from 'vitest'
import type { Task } from '../../types'
import { projectsOf } from '../../lib/tasks/projectTags'
import { applyTaskView, type TaskView } from './filtering'

const NOW = new Date(2026, 8, 15, 12, 0) // local 2026-09-15 12:00, a Tuesday
const WEEK_STARTS_ON = 1 // Monday, so this week is 14 Sep – 20 Sep

let n = 0
function task(patch: Partial<Task>): Task {
  n++
  return {
    id: `t${n}`,
    title: `Task ${n}`,
    description: '',
    status: 'todo',
    priority: 'medium',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...patch,
  }
}

const base: TaskView = {
  status: 'all',
  priority: 'all',
  due: 'all',
  sort: 'due',
  project: 'all',
  group: 'none',
}

describe('applyTaskView', () => {
  const tasks = [
    task({ status: 'done', priority: 'low', projects: ['site'] }),
    task({ status: 'todo', priority: 'high', dueDate: '2026-09-14' }), // overdue
    task({
      status: 'in-progress',
      priority: 'medium',
      dueDate: '2026-09-15',
      projects: ['site', 'report'],
    }),
    task({ status: 'todo', priority: 'low', dueDate: '2026-09-18', projects: ['report'] }),
    task({ status: 'todo', priority: 'high' }), // no date, untagged
  ]

  it('filters by status, priority and due bucket', () => {
    expect(applyTaskView(tasks, { ...base, status: 'todo' }, NOW, WEEK_STARTS_ON)).toHaveLength(3)
    expect(applyTaskView(tasks, { ...base, priority: 'high' }, NOW, WEEK_STARTS_ON)).toHaveLength(2)
    expect(applyTaskView(tasks, { ...base, due: 'overdue' }, NOW, WEEK_STARTS_ON)).toHaveLength(1)
    expect(applyTaskView(tasks, { ...base, due: 'none' }, NOW, WEEK_STARTS_ON)).toHaveLength(2)
  })

  it('filters by project, including the untagged sentinel', () => {
    expect(applyTaskView(tasks, { ...base, project: 'site' }, NOW, WEEK_STARTS_ON)).toHaveLength(2)
    const untagged = applyTaskView(tasks, { ...base, project: 'untagged' }, NOW, WEEK_STARTS_ON)
    expect(untagged.every((t) => projectsOf(t).length === 0)).toBe(true)
    expect(untagged).toHaveLength(2)
  })

  it('matches a task on ANY of its tags, not just the first', () => {
    // The in-progress task carries both site and report.
    const byReport = applyTaskView(tasks, { ...base, project: 'report' }, NOW, WEEK_STARTS_ON)
    expect(byReport.map((t) => t.status)).toEqual(['in-progress', 'todo'])
  })

  it('sorts dated tasks chronologically before undated, tiebreaking on priority', () => {
    const sorted = applyTaskView(tasks, base, NOW, WEEK_STARTS_ON)
    const dates = sorted.map((t) => t.dueDate ?? 'none')
    expect(dates).toEqual(['2026-09-14', '2026-09-15', '2026-09-18', 'none', 'none'])
    // Both undated: high before low.
    expect(sorted[3].priority).toBe('high')
  })

  it('sort by updated is newest first', () => {
    const a = task({ updatedAt: '2026-09-10T00:00:00.000Z' })
    const b = task({ updatedAt: '2026-09-12T00:00:00.000Z' })
    const sorted = applyTaskView([a, b], { ...base, sort: 'updated' }, NOW, WEEK_STARTS_ON)
    expect(sorted[0].id).toBe(b.id)
  })
})

describe('applyTaskView: this calendar week', () => {
  // Monday to Sunday around NOW (Tue 15 Sep), plus one either side.
  const tasks = [
    task({ dueDate: '2026-09-13' }), // the Sunday before — last week
    task({ dueDate: '2026-09-14' }), // Monday, already past but still this week
    task({ dueDate: '2026-09-15' }), // today
    task({ dueDate: '2026-09-20' }), // Sunday, the last day of the week
    task({ dueDate: '2026-09-21' }), // next Monday
    task({}), // undated
    task({ dueDate: '2026-09-16', status: 'done' }),
  ]

  it('spans the whole week, not a rolling seven days', () => {
    const week = applyTaskView(tasks, { ...base, due: 'calendarWeek' }, NOW, 1)
    expect(week.map((t) => t.dueDate)).toEqual([
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-20',
    ])
  })

  it('moves with weekStartsOn', () => {
    // Sunday-start weeks run 13–19 Sep: the 13th joins, the 20th drops out.
    const week = applyTaskView(tasks, { ...base, due: 'calendarWeek' }, NOW, 0)
    expect(week.map((t) => t.dueDate)).toEqual([
      '2026-09-13',
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
    ])
  })

  it('combines with the open status filter, which spans todo and in-progress', () => {
    const open = applyTaskView(
      tasks,
      { ...base, status: 'open', due: 'calendarWeek' },
      NOW,
      WEEK_STARTS_ON,
    )
    // Same as the first case minus the done task on the 16th.
    expect(open.map((t) => t.dueDate)).toEqual(['2026-09-14', '2026-09-15', '2026-09-20'])
  })
})
