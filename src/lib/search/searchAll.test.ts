import { describe, expect, it, vi } from 'vitest'
import type { Bookmark, CalEvent, Note, Task } from '../../types'
import { COMMANDS } from './commands'
import { runResultAction, searchAll, type ActionDeps, type SearchData } from './searchAll'

const T0 = '2026-09-10T00:00:00.000Z'
const T1 = '2026-09-15T00:00:00.000Z'

let n = 0
const task = (title: string, patch: Partial<Task> = {}): Task => ({
  id: `t${++n}`,
  title,
  description: '',
  status: 'todo',
  priority: 'medium',
  createdAt: T0,
  updatedAt: T0,
  ...patch,
})
const note = (text: string, patch: Partial<Note> = {}): Note => ({
  id: `n${++n}`,
  text,
  createdAt: T0,
  updatedAt: T0,
  ...patch,
})
const bookmark = (title: string, url: string, patch: Partial<Bookmark> = {}): Bookmark => ({
  id: `b${++n}`,
  title,
  url,
  createdAt: T0,
  updatedAt: T0,
  ...patch,
})
const event = (title: string, date: string): CalEvent => ({
  id: `e${++n}`,
  title,
  date,
  createdAt: T0,
  updatedAt: T0,
})

const data = (patch: Partial<SearchData> = {}): SearchData => ({
  tasks: [],
  notes: [],
  bookmarks: [],
  events: [],
  ...patch,
})

describe('searchAll', () => {
  it('empty query lists every command plus a few recents — never the whole store', () => {
    const tasks = Array.from({ length: 30 }, (_, i) =>
      task(`Task ${i}`, { updatedAt: i === 7 ? T1 : T0 }),
    )
    const results = searchAll('', data({ tasks }))
    expect(results.filter((r) => r.kind === 'command')).toHaveLength(COMMANDS.length)
    const nonCommands = results.filter((r) => r.kind !== 'command')
    expect(nonCommands.length).toBeLessThanOrEqual(4)
    // Most recently updated item leads the recents.
    expect(nonCommands[0].title).toBe('Task 7')
  })

  it('caps each kind at 6 matches', () => {
    const tasks = Array.from({ length: 15 }, (_, i) => task(`report ${i}`))
    const results = searchAll('report', data({ tasks }))
    expect(results.filter((r) => r.kind === 'task')).toHaveLength(6)
  })

  it('each result kind carries the right action payload', () => {
    const d = data({
      tasks: [task('Ship the report')],
      notes: [note('Vendor call\ndetails here')],
      bookmarks: [bookmark('HKO', 'https://www.hko.gov.hk')],
      events: [event('Team meeting', '2026-09-18')],
    })
    expect(searchAll('ship', d)[0].action).toEqual({ type: 'open-task', id: d.tasks[0].id })
    expect(searchAll('vendor', d)[0].action).toEqual({ type: 'focus-note', id: d.notes[0].id })
    expect(searchAll('hko', d)[0].action).toEqual({
      type: 'open-bookmark',
      url: 'https://www.hko.gov.hk',
    })
    expect(searchAll('meeting', d)[0].action).toEqual({
      type: 'open-calendar',
      date: '2026-09-18',
    })
  })

  it('typing a date string finds the day via its events', () => {
    const d = data({ events: [event('Standup', '2026-09-18')] })
    const hit = searchAll('2026-09-18', d).find((r) => r.kind === 'event')
    expect(hit?.action).toEqual({ type: 'open-calendar', date: '2026-09-18' })
  })

  it('done tasks rank below open tasks with the same match', () => {
    const open = task('Quarterly report')
    const done = task('Quarterly report', { status: 'done' })
    const results = searchAll('quarterly', data({ tasks: [done, open] }))
    const taskHits = results.filter((r) => r.kind === 'task')
    expect(taskHits.map((r) => r.id)).toEqual([open.id, done.id])
  })

  it('newer item wins a score tie within a kind', () => {
    const older = task('Same title', { updatedAt: T0 })
    const newer = task('Same title', { updatedAt: T1 })
    const hits = searchAll('same', data({ tasks: [older, newer] })).filter(
      (r) => r.kind === 'task',
    )
    expect(hits[0].id).toBe(newer.id)
  })

  it('results stay contiguous by kind so headers render once per group', () => {
    const d = data({
      tasks: [task('alpha one'), task('alpha two')],
      notes: [note('alpha note')],
    })
    const kinds = searchAll('alpha', d).map((r) => r.kind)
    const transitions = kinds.filter((k, i) => i > 0 && kinds[i - 1] !== k).length
    expect(new Set(kinds).size - 1).toBe(transitions)
  })
})

describe('runResultAction', () => {
  const deps = (): ActionDeps => ({
    openTaskEditor: vi.fn(),
    focusNote: vi.fn(),
    openCalendar: vi.fn(),
    setActiveTab: vi.fn(),
    focusNoteCapture: vi.fn(),
    focusBookmarks: vi.fn(),
    openTaskEditorNew: vi.fn(),
    openReview: vi.fn(),
    openWhiteboard: vi.fn(),
    openSettings: vi.fn(),
    openHelp: vi.fn(),
    openUrl: vi.fn(),
  })

  it('routes item actions to the matching dep', () => {
    const d = deps()
    runResultAction({ type: 'open-task', id: 'x' }, d)
    expect(d.openTaskEditor).toHaveBeenCalledWith('x')
    runResultAction({ type: 'open-bookmark', url: 'https://a.b' }, d)
    expect(d.openUrl).toHaveBeenCalledWith('https://a.b')
    runResultAction({ type: 'open-calendar', date: '2026-09-18' }, d)
    expect(d.openCalendar).toHaveBeenCalledWith('2026-09-18')
  })

  it('every command id routes somewhere', () => {
    for (const c of COMMANDS) {
      const d = deps()
      runResultAction({ type: 'command', id: c.id }, d)
      const called = Object.values(d).filter(
        (fn) => (fn as ReturnType<typeof vi.fn>).mock.calls.length > 0,
      )
      expect(called, `command ${c.id} routed nowhere`).toHaveLength(1)
    }
  })
})
