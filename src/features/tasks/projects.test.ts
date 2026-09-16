import { describe, expect, it } from 'vitest'
import type { ProjectMeta, Task } from '../../types'
import { projectsOf } from '../../lib/tasks/projectTags'
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
/** One tag, several, or none — the shorthand keeps the single-tag cases
 *  reading the way they did before tags became a list. */
function task(tags: string | string[] | undefined, status: Task['status'] = 'todo'): Task {
  n++
  return {
    id: `t${n}`,
    title: `Task ${n}`,
    description: '',
    status,
    priority: 'medium',
    projects: tags === undefined ? undefined : typeof tags === 'string' ? [tags] : tags,
    createdAt: NOW,
    updatedAt: NOW,
  }
}

const tagsOf = (tasks: Task[], id: string) => projectsOf(tasks.find((t) => t.id === id)!)

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

  it('counts a multi-tagged task once under each of its tags', () => {
    const derived = deriveProjects([task(['site', 'ops']), task('ops', 'done')], [])
    expect(derived).toEqual([
      expect.objectContaining({ name: 'ops', open: 1, done: 1, total: 2 }),
      expect.objectContaining({ name: 'site', open: 1, done: 0, total: 1 }),
    ])
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

  it('lists a multi-tagged task in every one of its sections', () => {
    const shared = task(['a', 'b'])
    const all = [shared, task('b'), task(undefined)]
    const groups = groupTasksByProject(all, all, [])
    expect(groups.map((g) => g.project?.name ?? null)).toEqual(['a', 'b', null])
    expect(groups[0].tasks).toEqual([shared])
    expect(groups[1].tasks.map((t) => t.id)).toEqual([shared.id, all[1].id])
    // …and it is not ALSO untagged.
    expect(groups[2].tasks).toEqual([all[2]])
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
    expect(r.tasks.filter((t) => projectsOf(t).includes('new'))).toHaveLength(2)
    expect(r.tasks.filter((t) => projectsOf(t).includes('old'))).toHaveLength(0)
    expect(r.projectMeta).toEqual([{ name: 'new', color: 'violet', updatedAt: NOW }])
  })

  it('merging onto an existing project keeps the target meta', () => {
    const tasks = [task('a'), task('b')]
    const m = meta([
      { name: 'a', color: 'rose' },
      { name: 'b', color: 'sky' },
    ])
    const r = renameProjectIn(tasks, m, 'a', 'b', NOW)
    expect(r.tasks.every((t) => projectsOf(t).includes('b'))).toBe(true)
    expect(r.projectMeta).toEqual([{ name: 'b', color: 'sky', updatedAt: NOW }])
  })

  it('renaming onto a tag the task already carries collapses the duplicate', () => {
    const tasks = [task(['a', 'b'])]
    const r = renameProjectIn(tasks, [], 'a', 'b', NOW)
    expect(tagsOf(r.tasks, tasks[0].id)).toEqual(['b'])
  })

  it('leaves the other tags on the task alone', () => {
    const tasks = [task(['old', 'keep'])]
    const r = renameProjectIn(tasks, [], 'old', 'new', NOW)
    expect(tagsOf(r.tasks, tasks[0].id)).toEqual(['new', 'keep'])
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
    expect(r.tasks.find((t) => t.id === tasks[0].id)?.projects).toBeUndefined()
    expect(tagsOf(r.tasks, tasks[1].id)).toEqual(['b'])
    expect(r.projectMeta).toEqual([])
  })

  it('clearProjectIn removes only that tag, so the task keeps the others', () => {
    const tasks = [task(['a', 'b'])]
    const r = clearProjectIn(tasks, meta([{ name: 'a' }]), 'a', NOW)
    expect(tagsOf(r.tasks, tasks[0].id)).toEqual(['b'])
  })
})
