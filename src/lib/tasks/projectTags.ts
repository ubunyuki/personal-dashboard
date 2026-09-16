import type { Task } from '../../types'

/**
 * Project tags on a task. A task carries a LIST of them and appears under
 * every one when grouping — see features/tasks/projects.ts, which owns the
 * project view itself. The list lives here, in lib, because the search index
 * and the weekly review both read it and neither may import from features.
 *
 * Identity is the exact trimmed string, matching ProjectMeta.name. Case only
 * matters when parsing one field's worth of input, where "Site, site" is a
 * typo rather than two projects.
 */

/** Trim, drop empties, dedupe case-insensitively — first spelling wins.
 *  Returns undefined rather than [] so an untagged task stores nothing. */
export function normalizeProjectTags(tags: Iterable<unknown>): string[] | undefined {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of tags) {
    if (typeof raw !== 'string') continue
    const tag = raw.trim()
    if (!tag) continue
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(tag)
  }
  return out.length > 0 ? out : undefined
}

/** The editor's comma-separated field → tags. */
export function parseProjectTags(input: string): string[] | undefined {
  return normalizeProjectTags(input.split(','))
}

/** Tags → the editor's field. */
export function formatProjectTags(tags: string[] | undefined): string {
  return (tags ?? []).join(', ')
}

/**
 * THE read accessor. `projects` is nested inside an array element, so a
 * same-version rehydrate never backfills it — nothing should reach for
 * `task.projects` directly. Also filters junk, since a hand-edited backup
 * can put anything in there.
 */
export function projectsOf(task: Pick<Task, 'projects'>): string[] {
  if (!Array.isArray(task.projects)) return []
  const out: string[] = []
  for (const raw of task.projects) {
    if (typeof raw !== 'string') continue
    const tag = raw.trim()
    if (tag) out.push(tag)
  }
  return out
}

/** Every tag in use, sorted — the editor's suggestion list. */
export function allProjectTags(tasks: Task[]): string[] {
  const seen = new Set<string>()
  for (const t of tasks) for (const tag of projectsOf(t)) seen.add(tag)
  return [...seen].sort((a, b) => a.localeCompare(b))
}
