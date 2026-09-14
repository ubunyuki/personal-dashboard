import { Layers } from 'lucide-react'
import { tintChipCls } from '../../components/ui/swatches'
import type { ProjectSummary } from './projects'
import type { TaskView } from './filtering'

const baseChip = 'rounded-full px-2.5 py-0.5 text-xs font-medium transition-shadow'
const neutralChip =
  'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
const activeRing = 'ring-2 ring-slate-500/60 dark:ring-slate-300/50'

/**
 * The project filter: one coloured chip per project (click to filter,
 * click again to clear), plus All / No project, plus the group-by toggle.
 * Rendered only when at least one project exists.
 */
export function ProjectChips({
  projects,
  untaggedOpen,
  view,
  onChange,
}: {
  projects: ProjectSummary[]
  /** Open tasks without a tag; the "No project" chip hides at 0. */
  untaggedOpen: number
  view: TaskView
  onChange: (view: TaskView) => void
}) {
  const pick = (project: string) =>
    onChange({ ...view, project: view.project === project ? 'all' : project })
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange({ ...view, project: 'all' })}
        className={`${baseChip} ${neutralChip} ${view.project === 'all' ? activeRing : ''}`}
      >
        All
      </button>
      {projects.map((p) => (
        <button
          key={p.name}
          type="button"
          onClick={() => pick(p.name)}
          title={`${p.open} open · ${p.done} done`}
          className={`${baseChip} ${tintChipCls[p.color]} ${
            view.project === p.name ? activeRing : ''
          }`}
        >
          {p.name} <span className="opacity-60 tabular-nums">{p.open}</span>
        </button>
      ))}
      {untaggedOpen > 0 && (
        <button
          type="button"
          onClick={() => pick('untagged')}
          className={`${baseChip} ${neutralChip} ${view.project === 'untagged' ? activeRing : ''}`}
        >
          No project <span className="opacity-60 tabular-nums">{untaggedOpen}</span>
        </button>
      )}
      <button
        type="button"
        title={view.group === 'project' ? 'Flat list' : 'Group by project'}
        aria-pressed={view.group === 'project'}
        onClick={() =>
          onChange({ ...view, group: view.group === 'project' ? 'none' : 'project' })
        }
        className={`ml-auto rounded-md p-1.5 ${
          view.group === 'project'
            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300'
        }`}
      >
        <Layers size={15} strokeWidth={1.75} />
      </button>
    </div>
  )
}
