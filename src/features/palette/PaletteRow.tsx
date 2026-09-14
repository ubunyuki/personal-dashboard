import type { ReactNode } from 'react'
import {
  Bookmark,
  CalendarDays,
  ListTodo,
  StickyNote,
  Terminal,
  type LucideIcon,
} from 'lucide-react'
import type { SearchKind, SearchResult } from '../../lib/search/searchAll'

const kindIcon: Record<SearchKind, LucideIcon> = {
  command: Terminal,
  task: ListTodo,
  note: StickyNote,
  bookmark: Bookmark,
  event: CalendarDays,
}

/** Bold the matched ranges of the title. */
function highlight(title: string, ranges?: Array<[number, number]>): ReactNode {
  if (!ranges || ranges.length === 0) return title
  const parts: ReactNode[] = []
  let pos = 0
  for (const [start, end] of ranges) {
    if (start > pos) parts.push(title.slice(pos, start))
    parts.push(
      <b key={start} className="font-semibold text-indigo-600 dark:text-indigo-400">
        {title.slice(start, end)}
      </b>,
    )
    pos = end
  }
  if (pos < title.length) parts.push(title.slice(pos))
  return parts
}

/** An option row — a div, not a button: focus must stay in the combobox
 *  input, with aria-activedescendant carrying the selection. */
export function PaletteRow({
  result,
  domId,
  active,
  onHover,
  onSelect,
}: {
  result: SearchResult
  domId: string
  active: boolean
  onHover: () => void
  onSelect: () => void
}) {
  const Icon = kindIcon[result.kind]
  return (
    <div
      id={domId}
      role="option"
      aria-selected={active}
      onMouseMove={onHover}
      // Fires before the input's blur; click would land too late.
      onMouseDown={(e) => {
        e.preventDefault()
        onSelect()
      }}
      className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 ${
        active ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''
      }`}
    >
      <Icon
        size={15}
        strokeWidth={1.75}
        className={`shrink-0 ${active ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500'}`}
      />
      <span className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-200">
        {highlight(result.title, result.ranges)}
      </span>
      {result.detail && (
        <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{result.detail}</span>
      )}
    </div>
  )
}
