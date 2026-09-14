import { GROUP_COLORS, type GroupColor, type ProjectMeta, type Task } from '../../types'

/**
 * Projects are a VIEW of tasks: a project exists exactly while some task
 * carries its tag (task.project, trimmed). ProjectMeta rows only decorate —
 * colour and manual order — and rows whose tag no longer appears on any
 * task are ignored (harmless ghosts in storage, invisible in the UI).
 */

/** Stable colour for an unconfigured project: djb2 hash into the palette,
 *  so a tag keeps its hue across sessions until a swatch overrides it. */
export function colorForProject(name: string, meta?: ProjectMeta): GroupColor {
  if (meta?.color) return meta.color
  let h = 5381
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h + name.charCodeAt(i)) | 0
  return GROUP_COLORS[Math.abs(h) % GROUP_COLORS.length]
}

export interface ProjectSummary {
  name: string
  color: GroupColor
  /** true when the colour came from a swatch, not the hash. */
  customColor: boolean
  open: number
  done: number
  total: number
}

const metaFor = (meta: ProjectMeta[], name: string): ProjectMeta | undefined =>
  meta.find((m) => m.name === name)

/** Ordered summaries of every project that currently has tasks: rows with a
 *  manual order first (ascending), then the rest alphabetically. */
export function deriveProjects(tasks: Task[], meta: ProjectMeta[]): ProjectSummary[] {
  const byName = new Map<string, { open: number; done: number }>()
  for (const t of tasks) {
    if (!t.project) continue
    const c = byName.get(t.project) ?? { open: 0, done: 0 }
    if (t.status === 'done') c.done++
    else c.open++
    byName.set(t.project, c)
  }
  const summaries = [...byName.entries()].map(([name, c]): ProjectSummary => {
    const m = metaFor(meta, name)
    return {
      name,
      color: colorForProject(name, m),
      customColor: m?.color !== undefined,
      open: c.open,
      done: c.done,
      total: c.open + c.done,
    }
  })
  const orderOf = (name: string) => metaFor(meta, name)?.order
  return summaries.sort((a, b) => {
    const oa = orderOf(a.name)
    const ob = orderOf(b.name)
    if (oa !== undefined && ob !== undefined) return oa - ob || a.name.localeCompare(b.name)
    if (oa !== undefined) return -1
    if (ob !== undefined) return 1
    return a.name.localeCompare(b.name)
  })
}

export interface ProjectGroup {
  /** null = the trailing "No project" bucket. */
  project: ProjectSummary | null
  tasks: Task[]
}

/**
 * Buckets an ALREADY filtered+sorted task list into project sections.
 * Section order comes from deriveProjects over the full task list (so counts
 * reflect the whole project, not the current filter); sections with no
 * visible tasks are dropped; untagged tasks land in a trailing null group.
 */
export function groupTasksByProject(
  visible: Task[],
  allTasks: Task[],
  meta: ProjectMeta[],
): ProjectGroup[] {
  const buckets = new Map<string, Task[]>()
  const untagged: Task[] = []
  for (const t of visible) {
    if (!t.project) {
      untagged.push(t)
      continue
    }
    const list = buckets.get(t.project) ?? []
    list.push(t)
    buckets.set(t.project, list)
  }
  const groups: ProjectGroup[] = []
  for (const p of deriveProjects(allTasks, meta)) {
    const tasks = buckets.get(p.name)
    if (tasks) groups.push({ project: p, tasks })
  }
  if (untagged.length > 0) groups.push({ project: null, tasks: untagged })
  return groups
}

/** Upsert helper: returns meta with the named row patched (created if absent). */
function upsertMeta(
  meta: ProjectMeta[],
  name: string,
  patch: Partial<Omit<ProjectMeta, 'name'>>,
  now: string,
): ProjectMeta[] {
  const existing = metaFor(meta, name)
  if (existing) {
    return meta.map((m) => (m.name === name ? { ...m, ...patch, updatedAt: now } : m))
  }
  return [...meta, { name, ...patch, updatedAt: now }]
}

/** Pure core of the renameProject action: rewrites every matching task tag
 *  and moves the meta row. Renaming ONTO an existing project merges into it —
 *  the target keeps its own colour/order and the source row is dropped. */
export function renameProjectIn(
  tasks: Task[],
  meta: ProjectMeta[],
  from: string,
  to: string,
  now: string,
): { tasks: Task[]; projectMeta: ProjectMeta[] } {
  const target = to.trim()
  if (!target || target === from) return { tasks, projectMeta: meta }
  if (!tasks.some((t) => t.project === from) && !metaFor(meta, from)) {
    return { tasks, projectMeta: meta }
  }
  const nextTasks = tasks.map((t) =>
    t.project === from ? { ...t, project: target, updatedAt: now } : t,
  )
  const source = metaFor(meta, from)
  let nextMeta = meta.filter((m) => m.name !== from)
  if (!metaFor(nextMeta, target) && source) {
    nextMeta = [...nextMeta, { ...source, name: target, updatedAt: now }]
  }
  return { tasks: nextTasks, projectMeta: nextMeta }
}

/** Pure core of setProjectColor: undefined returns the project to its
 *  hash-derived colour (the row stays for any manual order it carries). */
export function setProjectColorIn(
  meta: ProjectMeta[],
  name: string,
  color: GroupColor | undefined,
  now: string,
): ProjectMeta[] {
  return upsertMeta(meta, name, { color }, now)
}

/**
 * Pure core of moveProject: swaps the project with its neighbour in the
 * CURRENT derived order, then materializes order = index onto every project
 * that has tasks — so a first move gives every row an explicit rank and
 * later moves stay stable.
 */
export function moveProjectIn(
  tasks: Task[],
  meta: ProjectMeta[],
  name: string,
  delta: -1 | 1,
  now: string,
): ProjectMeta[] {
  const names = deriveProjects(tasks, meta).map((p) => p.name)
  const i = names.indexOf(name)
  const j = i + delta
  if (i < 0 || j < 0 || j >= names.length) return meta
  ;[names[i], names[j]] = [names[j], names[i]]
  let next = meta
  names.forEach((n, index) => {
    next = upsertMeta(next, n, { order: index }, now)
  })
  return next
}

/** Pure core of clearProject: members become untagged, the meta row goes. */
export function clearProjectIn(
  tasks: Task[],
  meta: ProjectMeta[],
  name: string,
  now: string,
): { tasks: Task[]; projectMeta: ProjectMeta[] } {
  return {
    tasks: tasks.map((t) =>
      t.project === name ? { ...t, project: undefined, updatedAt: now } : t,
    ),
    projectMeta: meta.filter((m) => m.name !== name),
  }
}
