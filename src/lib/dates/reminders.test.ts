import { describe, expect, it } from 'vitest'
import type { CalEvent, Task } from '../../types'
import { deriveReminders } from './reminders'

const NOW = new Date(2026, 8, 14, 12, 0, 0) // Mon 14 Sep 2026, 12:00 local
const A = '2026-09-01T00:00:00.000Z'

let n = 0
const task = (over: Partial<Task>): Task => ({
  id: `t${n++}`,
  title: 'task',
  description: '',
  status: 'todo',
  priority: 'medium',
  createdAt: A,
  updatedAt: A,
  ...over,
})
const event = (over: Partial<CalEvent>): CalEvent => ({
  id: `e${n++}`,
  title: 'event',
  date: '2026-09-14',
  createdAt: A,
  updatedAt: A,
  ...over,
})

describe('deriveReminders', () => {
  it('puts yesterday in overdue', () => {
    const r = deriveReminders([task({ dueDate: '2026-09-13' })], [], NOW)
    expect(r.overdue).toHaveLength(1)
    expect(r.dueSoon).toHaveLength(0)
  })

  it('splits today by due time: past → overdue, future → due soon, none → due soon', () => {
    const past = task({ dueDate: '2026-09-14', dueTime: '09:00' })
    const future = task({ dueDate: '2026-09-14', dueTime: '15:00' })
    const noTime = task({ dueDate: '2026-09-14' })
    const r = deriveReminders([past, future, noTime], [], NOW)
    expect(r.overdue.map((t) => t.id)).toEqual([past.id])
    expect(r.dueSoon.map((t) => t.id).sort()).toEqual([future.id, noTime.id].sort())
  })

  it('excludes done tasks everywhere', () => {
    const r = deriveReminders(
      [task({ dueDate: '2026-09-13', status: 'done' }), task({ dueDate: '2026-09-14', status: 'done' })],
      [],
      NOW,
    )
    expect(r.count).toBe(0)
  })

  it('includes tomorrow in due soon, later days not at all', () => {
    const r = deriveReminders(
      [task({ dueDate: '2026-09-15' }), task({ dueDate: '2026-09-16' })],
      [],
      NOW,
    )
    expect(r.dueSoon).toHaveLength(1)
    expect(r.count).toBe(1)
  })

  it("lists today's events only, timeless first, and sums the badge count", () => {
    const r = deriveReminders(
      [task({ dueDate: '2026-09-13' })],
      [event({ time: '15:00' }), event({}), event({ date: '2026-09-15' })],
      NOW,
    )
    expect(r.todayEvents.map((e) => e.time ?? null)).toEqual([null, '15:00'])
    expect(r.count).toBe(3)
  })

  it('flips yesterday to overdue right after local midnight', () => {
    const justPastMidnight = new Date(2026, 8, 15, 0, 0, 1)
    const r = deriveReminders([task({ dueDate: '2026-09-14' })], [], justPastMidnight)
    expect(r.overdue).toHaveLength(1)
  })
})
