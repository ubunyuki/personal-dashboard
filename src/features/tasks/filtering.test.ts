import { describe, expect, it } from 'vitest'
import type { Task } from '../../types'
import { applyTaskView, type TaskView } from './filtering'

const NOW = new Date(2026, 8, 15, 12, 0) // local 2026-09-15 12:00

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
    task({ status: 'done', priority: 'low', project: 'site' }),
    task({ status: 'todo', priority: 'high', dueDate: '2026-09-14' }), // overdue
    task({ status: 'in-progress', priority: 'medium', dueDate: '2026-09-15', project: 'site' }),
    task({ status: 'todo', priority: 'low', dueDate: '2026-09-18', project: 'report' }),
    task({ status: 'todo', priority: 'high' }), // no date, untagged
  ]

  it('filters by status, priority and due bucket', () => {
    expect(applyTaskView(tasks, { ...base, status: 'todo' }, NOW)).toHaveLength(3)
    expect(applyTaskView(tasks, { ...base, priority: 'high' }, NOW)).toHaveLength(2)
    expect(applyTaskView(tasks, { ...base, due: 'overdue' }, NOW)).toHaveLength(1)
    expect(applyTaskView(tasks, { ...base, due: 'none' }, NOW)).toHaveLength(2)
  })

  it('filters by project, including the untagged sentinel', () => {
    expect(applyTaskView(tasks, { ...base, project: 'site' }, NOW)).toHaveLength(2)
    const untagged = applyTaskView(tasks, { ...base, project: 'untagged' }, NOW)
    expect(untagged.every((t) => t.project === undefined)).toBe(true)
    expect(untagged).toHaveLength(2)
  })

  it('sorts dated tasks chronologically before undated, tiebreaking on priority', () => {
    const sorted = applyTaskView(tasks, base, NOW)
    const dates = sorted.map((t) => t.dueDate ?? 'none')
    expect(dates).toEqual(['2026-09-14', '2026-09-15', '2026-09-18', 'none', 'none'])
    // Both undated: high before low.
    expect(sorted[3].priority).toBe('high')
  })

  it('sort by updated is newest first', () => {
    const a = task({ updatedAt: '2026-09-10T00:00:00.000Z' })
    const b = task({ updatedAt: '2026-09-12T00:00:00.000Z' })
    const sorted = applyTaskView([a, b], { ...base, sort: 'updated' }, NOW)
    expect(sorted[0].id).toBe(b.id)
  })
})
