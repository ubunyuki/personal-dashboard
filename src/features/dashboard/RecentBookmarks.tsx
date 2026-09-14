import { useMemo } from 'react'
import { Card } from '../../components/ui/Card'
import { domainOf } from '../../lib/bookmarks/url'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import { Favicon } from '../bookmarks/Favicon'

export function RecentBookmarks() {
  const bookmarks = useAppStore((s) => s.bookmarks)
  const setActiveTab = useUiStore((s) => s.setActiveTab)
  const recent = useMemo(
    () => [...bookmarks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [bookmarks],
  )
  return (
    <Card accent="bookmarks" title="Bookmarks" right={bookmarks.length}>
      {recent.length === 0 ? (
        <p className="py-2 text-sm text-slate-400 dark:text-slate-500">
          Nothing saved yet — add links on the Bookmarks tab.
        </p>
      ) : (
        <div className="flex flex-col">
          {recent.map((b) => {
            const domain = domainOf(b.url)
            return (
              <a
                key={b.id}
                href={b.url}
                target="_blank"
                rel="noreferrer noopener"
                title={b.url}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-sky-100/60 dark:hover:bg-sky-900/30"
              >
                <Favicon url={b.url} />
                <span className="min-w-0 flex-1 truncate text-sm">{b.title}</span>
                {domain && (
                  <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                    {domain}
                  </span>
                )}
              </a>
            )
          })}
          {bookmarks.length > 5 && (
            <button
              type="button"
              onClick={() => setActiveTab('bookmarks')}
              className="mt-1 self-start rounded-md px-2 py-0.5 text-xs text-sky-700 hover:bg-sky-100/60 dark:text-sky-300 dark:hover:bg-sky-900/30"
            >
              View all {bookmarks.length} →
            </button>
          )}
        </div>
      )}
    </Card>
  )
}
