import type { Bookmark, CalEvent, Note, Task } from '../../types'
import type { Tab } from '../../store/uiStore'
import { domainOf } from '../bookmarks/url'
import { formatDueLabel } from '../dates/dates'
import { fuzzyMatch } from './match'
import { COMMANDS, type CommandDef, type CommandId } from './commands'

/**
 * Results carry a data-only, serializable action — never a closure — so
 * routing INTENT is assertable in node tests; runResultAction is the one
 * impure edge that turns an action into store calls / window.open.
 */
export type ResultAction =
  | { type: 'open-task'; id: string }
  | { type: 'focus-note'; id: string }
  | { type: 'open-bookmark'; url: string }
  | { type: 'open-calendar'; date: string }
  | { type: 'command'; id: CommandId }

export type SearchKind = 'command' | 'task' | 'note' | 'bookmark' | 'event'

export interface SearchResult {
  kind: SearchKind
  /** Stable DOM id fragment for aria-activedescendant. */
  id: string
  title: string
  /** Secondary line: project tag, domain, event date… */
  detail?: string
  /** Match ranges in `title` for bolding (absent for keyword/detail hits). */
  ranges?: Array<[number, number]>
  score: number
  action: ResultAction
}

export interface SearchData {
  tasks: Task[]
  notes: Note[]
  bookmarks: Bookmark[]
  events: CalEvent[]
}

const PER_KIND_CAP = 6

/** Weighted field match: best of (title×w1, extra fields×w). */
function best(
  query: string,
  fields: Array<{ text: string | undefined; weight: number; primary?: boolean }>,
): { score: number; ranges?: Array<[number, number]> } | null {
  let top: { score: number; ranges?: Array<[number, number]> } | null = null
  for (const f of fields) {
    if (!f.text) continue
    const m = fuzzyMatch(query, f.text)
    if (!m) continue
    const score = m.score * f.weight
    if (!top || score > top.score) {
      top = { score, ranges: f.primary ? m.ranges : undefined }
    }
  }
  return top
}

const noteTitle = (n: Note): string => n.text.split('\n', 1)[0]

/** domainOf returns null for unparseable URLs; every field here is optional. */
const domain = (url: string): string | undefined => domainOf(url) ?? undefined

function searchKind<T>(
  items: T[],
  toResult: (item: T) => SearchResult | null,
  updatedAt: (item: T) => string,
): SearchResult[] {
  const out: Array<{ r: SearchResult; u: string }> = []
  for (const item of items) {
    const r = toResult(item)
    if (r) out.push({ r, u: updatedAt(item) })
  }
  return out
    .sort((a, b) => b.r.score - a.r.score || b.u.localeCompare(a.u))
    .slice(0, PER_KIND_CAP)
    .map((x) => x.r)
}

/**
 * Flat, pre-ordered results: each kind internally by score (tiebreak:
 * newest updatedAt), kinds ordered by their best score (commands win
 * ties). The renderer inserts a header whenever `kind` changes, and
 * keyboard navigation indexes straight into this array.
 *
 * Empty query: every command, then the most recently touched items —
 * never the full task list.
 */
export function searchAll(
  query: string,
  data: SearchData,
  commands: CommandDef[] = COMMANDS,
): SearchResult[] {
  const q = query.trim()
  if (!q) {
    const recents = [
      ...data.tasks.map((t): SearchResult & { u: string } => ({
        kind: 'task',
        id: t.id,
        title: t.title,
        detail: t.project ? `#${t.project}` : undefined,
        score: 0,
        action: { type: 'open-task', id: t.id },
        u: t.updatedAt,
      })),
      ...data.notes.map((n): SearchResult & { u: string } => ({
        kind: 'note',
        id: n.id,
        title: noteTitle(n),
        score: 0,
        action: { type: 'focus-note', id: n.id },
        u: n.updatedAt,
      })),
      ...data.bookmarks.map((b): SearchResult & { u: string } => ({
        kind: 'bookmark',
        id: b.id,
        title: b.title,
        detail: domain(b.url),
        score: 0,
        action: { type: 'open-bookmark', url: b.url },
        u: b.updatedAt,
      })),
    ]
      .sort((a, b) => b.u.localeCompare(a.u))
      .slice(0, 4)
      .map(({ u: _u, ...r }) => r)
    return [
      ...commands.map(
        (c): SearchResult => ({
          kind: 'command',
          id: c.id,
          title: c.label,
          score: 0,
          action: { type: 'command', id: c.id },
        }),
      ),
      ...recents,
    ]
  }

  const commandResults = searchKind(
    commands,
    (c) => {
      const m = best(q, [
        { text: c.label, weight: 1, primary: true },
        { text: c.keywords, weight: 0.9 },
      ])
      return m
        ? {
            kind: 'command',
            id: c.id,
            title: c.label,
            ...m,
            action: { type: 'command', id: c.id },
          }
        : null
    },
    () => '',
  )

  const taskResults = searchKind(
    data.tasks,
    (t) => {
      const m = best(q, [
        { text: t.title, weight: 1, primary: true },
        { text: t.description, weight: 0.6 },
        { text: t.project, weight: 0.8 },
      ])
      if (!m) return null
      const doneFactor = t.status === 'done' ? 0.6 : 1
      return {
        kind: 'task',
        id: t.id,
        title: t.title,
        detail: t.project ? `#${t.project}` : undefined,
        ...m,
        score: m.score * doneFactor,
        action: { type: 'open-task', id: t.id },
      }
    },
    (t) => t.updatedAt,
  )

  const noteResults = searchKind(
    data.notes,
    (n) => {
      const first = noteTitle(n)
      const m = best(q, [
        { text: first, weight: 1, primary: true },
        { text: n.text, weight: 0.6 },
      ])
      return m
        ? { kind: 'note', id: n.id, title: first, ...m, action: { type: 'focus-note', id: n.id } }
        : null
    },
    (n) => n.updatedAt,
  )

  const bookmarkResults = searchKind(
    data.bookmarks,
    (b) => {
      const m = best(q, [
        { text: b.title, weight: 1, primary: true },
        { text: domain(b.url), weight: 0.7 },
        { text: b.url, weight: 0.4 },
      ])
      return m
        ? {
            kind: 'bookmark',
            id: b.id,
            title: b.title,
            detail: domain(b.url),
            ...m,
            action: { type: 'open-bookmark', url: b.url },
          }
        : null
    },
    (b) => b.updatedAt,
  )

  const eventResults = searchKind(
    data.events,
    (e) => {
      // Matching the raw date string means typing "2026-09-18" finds the day.
      const m = best(q, [
        { text: e.title, weight: 1, primary: true },
        { text: e.date, weight: 0.5 },
      ])
      return m
        ? {
            kind: 'event',
            id: e.id,
            title: e.title,
            detail: formatDueLabel(e.date, e.time),
            ...m,
            action: { type: 'open-calendar', date: e.date },
          }
        : null
    },
    (e) => e.updatedAt,
  )

  const kinds = [commandResults, taskResults, noteResults, bookmarkResults, eventResults]
  return kinds
    .filter((k) => k.length > 0)
    .sort((a, b) => b[0].score - a[0].score) // commands first on equal best score (stable sort)
    .flat()
}

/** Everything the impure edge needs; the palette builds this from stores. */
export interface ActionDeps {
  openTaskEditor: (id: string) => void
  focusNote: (id: string) => void
  openCalendar: (date?: string) => void
  setActiveTab: (tab: Tab) => void
  focusNoteCapture: () => void
  focusBookmarks: () => void
  openTaskEditorNew: () => void
  openReview: () => void
  openWhiteboard: () => void
  openSettings: () => void
  openHelp: () => void
  openUrl: (url: string) => void
}

export function runResultAction(action: ResultAction, deps: ActionDeps): void {
  switch (action.type) {
    case 'open-task':
      deps.openTaskEditor(action.id)
      return
    case 'focus-note':
      deps.focusNote(action.id)
      return
    case 'open-bookmark':
      deps.openUrl(action.url)
      return
    case 'open-calendar':
      deps.openCalendar(action.date)
      return
    case 'command':
      switch (action.id) {
        case 'new-task':
          deps.openTaskEditorNew()
          return
        case 'new-note':
          deps.focusNoteCapture()
          return
        case 'go-dashboard':
          deps.setActiveTab('dashboard')
          return
        case 'go-tasks':
          deps.setActiveTab('tasks')
          return
        case 'go-notes':
          deps.setActiveTab('notes')
          return
        case 'go-bookmarks':
          deps.focusBookmarks()
          return
        case 'open-calendar':
          deps.openCalendar()
          return
        case 'open-review':
          deps.openReview()
          return
        case 'open-whiteboard':
          deps.openWhiteboard()
          return
        case 'open-settings':
          deps.openSettings()
          return
        case 'open-help':
          deps.openHelp()
          return
      }
  }
}
