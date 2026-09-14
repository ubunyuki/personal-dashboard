import { describe, expect, it } from 'vitest'
import type { ProjectMeta, Task } from '../../types'
import {
  clearProjectIn,
  colorForProject,
  deriveProjects,
  groupTasksByProject,
  moveProjectIn,
  renameProjectIn,
  setProjectColorIn,
} from './projects'

const NOW = '2026-09-15T08:00:00.000Z'

let n = 0
function task(project: string | undefined, status: Task['status'] = 'todo'): Task {
  n++
  return {
    id: `t${n}`,
    title: `Task ${n}`,
    description: '',
    status,
    priority: 'medium',
    project,
    createdAt: NOW,
    updatedAt: NOW,
  }
}

const meta = (rows: Array<Partial<ProjectMeta> & { name: string }>): ProjectMeta[] =>
  rows.map((r) => ({ updatedAt: NOW, ...r }))

describe('colorForProject', () => {
  it('is deterministic and respects a meta override', () => {
    expect(colorForProject('alpha')).toBe(colorForProject('alpha'))
    expect(colorForProject('alpha', { name: 'alpha', color: 'rose', updatedAt: NOW })).toBe('rose')
  })
})

describe('deriveProjects', () => {
  it('counts open/done and sorts ordered rows first, the rest alphabetically', () => {
    const tasks = [task('zeta'), task('zeta', 'done'), task('alpha'), task('mid')]
    const m = meta([{ name: 'zeta', order: 0 }])
    const names = deriveProjects(tasks, m).map((p) => p.name)
    expect(names).toEqual(['zeta', 'alpha', 'mid'])
    const zeta = deriveProjects(tasks, m)[0]
    expect(zeta).toMatchObject({ open: 1, done: 1, total: 2 })
  })

  it('ignores ghost meta rows whose tag has no tasks', () => {
    const derived = deriveProjects([task('real')], meta([{ name: 'ghost', color: 'rose' }]))
    expect(derived.map((p) => p.name)).toEqual(['real'])
  })
})

describe('groupTasksByProject', () => {
  it('buckets visible tasks in derived order with untagged trailing', () => {
    const all = [task('b'), task('a'), task(undefined)]
    const groups = groupTasksByProject(all, all, [])
    expect(groups.map((g) => g.project?.name ?? null)).toEqual(['a', 'b', null])
  })

  it('drops sections with no visible tasks but keeps full-project counts', () => {
    const all = [task('a', 'done'), task('b')]
    const visible = all.filter((t) => t.status !== 'done')
    const groups = groupTasksByProject(visible, all, [])
    expect(groups.map((g) => g.project?.name)).toEqual(['b'])
  })
})

describe('renameProjectIn', () => {
  it('rewrites every matching task and moves the meta row', () => {
    const tasks = [task('old'), task('old'), task('other')]
    const m = meta([{ name: 'old', color: 'violet' }])
    const r = renameProjectIn(tasks, m, 'old', ' new ', NOW)
    expect(r.tasks.filter((t) => t.project === 'new')).toHaveLength(2)
    expect(r.tasks.filter((t) => t.project === 'old')).toHaveLength(0)
    expect(r.projectMeta).toEqual([{ name: 'new', color: 'violet', updatedAt: NOW }])
  })

  it('merging onto an existing project keeps the target meta', () => {
    const tasks = [task('a'), task('b')]
    const m = meta([
      { name: 'a', color: 'rose' },
      { name: 'b', color: 'sky' },
    ])
    const r = renameProjectIn(tasks, m, 'a', 'b', NOW)
    expect(r.tasks.every((t) => t.project === 'b')).toBe(true)
    expect(r.projectMeta).toEqual([{ name: 'b', color: 'sky', updatedAt: NOW }])
  })

  it('no-ops on empty, identical, or unknown names (same references back)', () => {
    const tasks = [task('a')]
    const m = meta([{ name: 'a' }])
    for (const [from, to] of [
      ['a', '  '],
      ['a', 'a'],
      ['missing', 'x'],
    ] as const) {
      const r = renameProjectIn(tasks, m, from, to, NOW)
      expect(r.tasks).toBe(tasks)
      expect(r.projectMeta).toBe(m)
    }
  })
})

describe('moveProjectIn', () => {
  it('swaps with the neighbour and materializes order onto every project', () => {
    const tasks = [task('a'), task('b'), task('c')]
    const moved = moveProjectIn(tasks, [], 'c', -1, NOW)
    const order = (name: string) => moved.find((m) => m.name === name)?.order
    expect(order('a')).toBe(0)
    expect(order('c')).toBe(1)
    expect(order('b')).toBe(2)
    // Derived order now honours the materialized ranks.
    expect(deriveProjects(tasks, moved).map((p) => p.name)).toEqual(['a', 'c', 'b'])
  })

  it('no-ops at the edges (same reference back)', () => {
    const tasks = [task('a'), task('b')]
    const m = meta([])
    expect(moveProjectIn(tasks, m, 'a', -1, NOW)).toBe(m)
    expect(moveProjectIn(tasks, m, 'b', 1, NOW)).toBe(m)
  })
})

describe('setProjectColorIn / clearProjectIn', () => {
  it('upserts a colour and undefined returns to automatic', () => {
    const set = setProjectColorIn([], 'a', 'amber', NOW)
    expect(set).toEqual([{ name: 'a', color: 'amber', updatedAt: NOW }])
    const auto = setProjectColorIn(set, 'a', undefined, NOW)
    expect(auto[0].color).toBeUndefined()
  })

  it('clearProjectIn untags members and drops the meta row', () => {
    const tasks = [task('a'), task('b')]
    const r = clearProjectIn(tasks, meta([{ name: 'a', color: 'rose' }]), 'a', NOW)
    expect(r.tasks.find((t) => t.id === tasks[0].id)?.project).toBeUndefined()
    expect(r.tasks.find((t) => t.id === tasks[1].id)?.project).toBe('b')
    expect(r.projectMeta).toEqual([])
  })
})
