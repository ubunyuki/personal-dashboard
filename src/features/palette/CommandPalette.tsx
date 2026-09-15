import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import {
  runResultAction,
  searchAll,
  type ActionDeps,
  type SearchKind,
  type SearchResult,
} from '../../lib/search/searchAll'
import { PaletteRow } from './PaletteRow'

const kindLabel: Record<SearchKind, string> = {
  command: 'Commands',
  task: 'Tasks',
  note: 'Notes',
  bookmark: 'Bookmarks',
  event: 'Events',
}

const rowDomId = (r: SearchResult) => `pal-${r.kind}-${r.id}`

/**
 * Ctrl+K palette: one search over tasks, notes, bookmarks and events plus
 * a command runner. Combobox pattern — focus stays in the input, options
 * are divs, aria-activedescendant tracks the selection.
 */
export function CommandPalette() {
  const closePalette = useUiStore((s) => s.closePalette)
  const tasks = useAppStore((s) => s.tasks)
  const notes = useAppStore((s) => s.notes)
  const bookmarks = useAppStore((s) => s.bookmarks)
  const events = useAppStore((s) => s.events)

  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const results = useMemo(
    () => searchAll(query, { tasks, notes, bookmarks, events }),
    [query, tasks, notes, bookmarks, events],
  )
  // Clamp instead of resetting in an effect: a shrinking result list keeps
  // the selection near where it was.
  const activeIndex = results.length === 0 ? -1 : Math.min(active, results.length - 1)
  const activeResult = activeIndex >= 0 ? results[activeIndex] : undefined

  useEffect(() => {
    if (!activeResult) return
    document.getElementById(rowDomId(activeResult))?.scrollIntoView({ block: 'nearest' })
  }, [activeResult])

  const run = (r: SearchResult) => {
    const ui = useUiStore.getState()
    const deps: ActionDeps = {
      openTaskEditor: ui.openTaskEditor,
      focusNote: ui.focusNote,
      openCalendar: ui.openCalendar,
      setActiveTab: ui.setActiveTab,
      focusNoteCapture: ui.focusNoteCapture,
      focusBookmarks: ui.focusBookmarks,
      openTaskEditorNew: () => ui.openTaskEditor(),
      openReview: ui.openReview,
      openWhiteboard: ui.openWhiteboard,
      openSettings: ui.openSettings,
      openHelp: ui.openHelp,
      openUrl: (url) => window.open(url, '_blank', 'noopener,noreferrer'),
    }
    closePalette()
    runResultAction(r.action, deps)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closePalette()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (results.length > 0) setActive((activeIndex + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (results.length > 0) setActive((activeIndex - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeResult) run(activeResult)
    }
  }

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <div className="absolute inset-0 bg-slate-900/30 dark:bg-black/50" onClick={closePalette} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search and commands"
        className="absolute inset-x-4 top-[15vh] mx-auto flex max-h-[60vh] w-auto max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center gap-2 border-b border-slate-200 px-3 dark:border-slate-800">
          <Search size={15} className="shrink-0 text-slate-400" />
          <input
            autoFocus
            role="combobox"
            aria-label="Search"
            aria-expanded={results.length > 0}
            aria-controls="palette-listbox"
            aria-activedescendant={activeResult ? rowDomId(activeResult) : undefined}
            className="w-full bg-transparent py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
            placeholder="Search tasks, notes, bookmarks, events — or run a command…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
          />
          <kbd className="shrink-0 rounded border border-slate-300 bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-slate-400 dark:border-slate-600 dark:bg-slate-800">
            esc
          </kbd>
        </div>
        <div
          ref={listRef}
          id="palette-listbox"
          role="listbox"
          aria-label="Results"
          className="flex-1 overflow-y-auto p-1.5"
        >
          {results.length === 0 ? (
            <p className="px-2.5 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
              No matches for “{query.trim()}”.
            </p>
          ) : (
            results.map((r, i) => (
              <div key={rowDomId(r)}>
                {(i === 0 || results[i - 1].kind !== r.kind) && (
                  <p className="px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                    {kindLabel[r.kind]}
                  </p>
                )}
                <PaletteRow
                  result={r}
                  domId={rowDomId(r)}
                  active={i === activeIndex}
                  onHover={() => setActive(i)}
                  onSelect={() => run(r)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
