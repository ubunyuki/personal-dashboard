import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, cardTitleCls } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { inputCls } from '../../components/ui/Field'
import { domainOf } from '../../lib/bookmarks/url'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import type { Bookmark, BookmarkGroup, GroupColor } from '../../types'
import { Favicon } from './Favicon'

/** <select> value for "no group". */
const UNGROUPED = ''

const GROUP_COLORS: GroupColor[] = ['sky', 'indigo', 'emerald', 'amber', 'rose', 'violet']

const swatchCls: Record<GroupColor, string> = {
  sky: 'bg-sky-400',
  indigo: 'bg-indigo-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  violet: 'bg-violet-400',
}

// Neutral hovers so rows and buttons read well on every group tint.
const iconBtn =
  'rounded p-1 text-slate-400 hover:bg-black/5 hover:text-slate-600 disabled:pointer-events-none disabled:opacity-30 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-300'

const titleBase = 'text-xs font-semibold tracking-wide uppercase'

export function BookmarksPage() {
  const bookmarks = useAppStore((s) => s.bookmarks)
  const groups = useAppStore((s) => s.bookmarkGroups)
  const addBookmark = useAppStore((s) => s.addBookmark)
  const addBookmarkGroup = useAppStore((s) => s.addBookmarkGroup)
  const focusToken = useUiStore((s) => s.bookmarkFocusToken)

  const [search, setSearch] = useState('')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [groupId, setGroupId] = useState(UNGROUPED)
  const [newGroupOpen, setNewGroupOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const urlRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (focusToken > 0) urlRef.current?.focus()
  }, [focusToken])

  const save = () => {
    if (!url.trim()) return
    addBookmark({ title, url, groupId: groupId || undefined })
    setUrl('')
    setTitle('')
    urlRef.current?.focus()
  }

  const createGroup = () => {
    const name = newGroupName.trim()
    if (!name) return
    const g = addBookmarkGroup(name)
    setGroupId(g.id)
    setNewGroupName('')
    setNewGroupOpen(false)
  }

  const q = search.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      q
        ? bookmarks.filter(
            (b) => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q),
          )
        : bookmarks,
    [bookmarks, q],
  )
  const byGroup = useMemo(() => {
    const m = new Map<string, Bookmark[]>()
    for (const b of filtered) {
      const key = b.groupId ?? UNGROUPED
      m.set(key, [...(m.get(key) ?? []), b])
    }
    return m
  }, [filtered])
  const ungrouped = byGroup.get(UNGROUPED) ?? []

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4">
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            ref={urlRef}
            className={inputCls}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste or type a link — example.com works too"
          />
          <input
            className={`${inputCls} sm:max-w-48`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className={`${inputCls} w-auto`}
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value={UNGROUPED}>Ungrouped</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          {newGroupOpen ? (
            <span className="flex items-center gap-1">
              <input
                className={`${inputCls} w-40`}
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    createGroup()
                  }
                  if (e.key === 'Escape') {
                    setNewGroupOpen(false)
                    setNewGroupName('')
                  }
                }}
                placeholder="Group name…"
                autoFocus
              />
              <Button onClick={createGroup} disabled={!newGroupName.trim()}>
                Add
              </Button>
            </span>
          ) : (
            <Button onClick={() => setNewGroupOpen(true)}>
              <span className="flex items-center gap-1.5">
                <FolderPlus size={14} /> New group
              </span>
            </Button>
          )}
          <Button variant="primary" type="submit" disabled={!url.trim()} className="ml-auto">
            Save bookmark
          </Button>
        </div>
      </form>

      {bookmarks.length > 0 && (
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-400"
          />
          <input
            className={`${inputCls} pl-8`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookmarks…"
          />
        </div>
      )}

      {bookmarks.length === 0 && groups.length === 0 ? (
        <EmptyState
          title="No bookmarks yet"
          hint="Save links you keep coming back to — group them by project or topic, and search across everything."
        />
      ) : (
        <>
          {q && filtered.length === 0 && (
            <p className="py-2 text-center text-sm text-slate-400 dark:text-slate-500">
              No bookmarks match “{search.trim()}”.
            </p>
          )}
          {groups.map((g, i) => {
            const items = byGroup.get(g.id) ?? []
            if (q && items.length === 0) return null
            return (
              <GroupSection
                key={g.id}
                group={g}
                items={items}
                first={i === 0}
                last={i === groups.length - 1}
              />
            )
          })}
          {ungrouped.length > 0 && (
            <Card accent="bookmarks">
              <header className="mb-1 flex items-baseline justify-between">
                <h3 className={`${titleBase} ${cardTitleCls.bookmarks}`}>Ungrouped</h3>
                <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500">
                  {ungrouped.length}
                </span>
              </header>
              <div className="flex flex-col">
                {ungrouped.map((b) => (
                  <BookmarkRow key={b.id} bookmark={b} />
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function GroupSection({
  group,
  items,
  first,
  last,
}: {
  group: BookmarkGroup
  items: Bookmark[]
  first: boolean
  last: boolean
}) {
  const updateBookmarkGroup = useAppStore((s) => s.updateBookmarkGroup)
  const deleteBookmarkGroup = useAppStore((s) => s.deleteBookmarkGroup)
  const moveBookmarkGroup = useAppStore((s) => s.moveBookmarkGroup)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const color = group.color ?? 'sky'

  const startEdit = () => {
    setDraft(group.name)
    setEditing(true)
  }
  const commit = () => {
    updateBookmarkGroup(group.id, { name: draft })
    setEditing(false)
  }

  return (
    <Card accent={color}>
      {editing ? (
        <div className="mb-1 flex flex-col gap-2">
          <span className="flex items-center gap-1">
            <input
              className={`${inputCls} max-w-56 py-0.5 text-xs`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commit()
                }
                if (e.key === 'Escape') setEditing(false)
              }}
              autoFocus
            />
            <button type="button" title="Save name" className={iconBtn} onClick={commit}>
              <Check size={14} />
            </button>
            <button
              type="button"
              title="Done"
              className={iconBtn}
              onClick={() => setEditing(false)}
            >
              <X size={14} />
            </button>
          </span>
          <span className="flex items-center gap-1.5 px-0.5">
            {GROUP_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => updateBookmarkGroup(group.id, { color: c })}
                className={`h-4 w-4 rounded-full transition-transform hover:scale-110 ${swatchCls[c]} ${
                  color === c ? 'ring-2 ring-slate-600 dark:ring-white' : ''
                }`}
              />
            ))}
          </span>
        </div>
      ) : (
        <header className="mb-1 flex items-center justify-between gap-2">
          <h3 className={`${titleBase} ${cardTitleCls[color]}`}>{group.name}</h3>
          <span className="flex items-center gap-0.5">
            <span className="mr-1 text-xs tabular-nums text-slate-400 dark:text-slate-500">
              {items.length}
            </span>
            <button
              type="button"
              title="Move group up"
              className={iconBtn}
              disabled={first}
              onClick={() => moveBookmarkGroup(group.id, -1)}
            >
              <ChevronUp size={13} />
            </button>
            <button
              type="button"
              title="Move group down"
              className={iconBtn}
              disabled={last}
              onClick={() => moveBookmarkGroup(group.id, 1)}
            >
              <ChevronDown size={13} />
            </button>
            <button
              type="button"
              title="Rename group / pick colour"
              className={iconBtn}
              onClick={startEdit}
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              title="Delete group (its bookmarks move to Ungrouped)"
              className={`${iconBtn} hover:text-red-600 dark:hover:text-red-400`}
              onClick={() => deleteBookmarkGroup(group.id)}
            >
              <Trash2 size={13} />
            </button>
          </span>
        </header>
      )}
      {items.length === 0 ? (
        <p className="py-1.5 text-sm text-slate-400 dark:text-slate-500">
          No bookmarks in this group yet.
        </p>
      ) : (
        <div className="flex flex-col">
          {items.map((b) => (
            <BookmarkRow key={b.id} bookmark={b} />
          ))}
        </div>
      )}
    </Card>
  )
}

function BookmarkRow({ bookmark }: { bookmark: Bookmark }) {
  const groups = useAppStore((s) => s.bookmarkGroups)
  const updateBookmark = useAppStore((s) => s.updateBookmark)
  const deleteBookmark = useAppStore((s) => s.deleteBookmark)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [groupId, setGroupId] = useState(UNGROUPED)

  const domain = domainOf(bookmark.url)

  const startEdit = () => {
    setTitle(bookmark.title)
    setUrl(bookmark.url)
    setGroupId(bookmark.groupId ?? UNGROUPED)
    setEditing(true)
  }
  const commit = () => {
    if (!url.trim()) return
    updateBookmark(bookmark.id, {
      title: title.trim() || bookmark.title,
      url,
      groupId: groupId || undefined,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-lg bg-white/70 p-2 dark:bg-slate-900/50">
        <input
          className={inputCls}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL"
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
          <select
            className={`${inputCls} sm:w-44`}
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value={UNGROUPED}>Ungrouped</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button onClick={() => setEditing(false)}>Cancel</Button>
          <Button variant="primary" onClick={commit} disabled={!url.trim()}>
            Save
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5">
      <Favicon url={bookmark.url} />
      <a
        href={bookmark.url}
        target="_blank"
        rel="noreferrer noopener"
        title={bookmark.url}
        className="min-w-0 flex-1 truncate text-sm hover:underline"
      >
        {bookmark.title}
      </a>
      {domain && (
        <span className="hidden shrink-0 text-[11px] text-slate-400 sm:inline dark:text-slate-500">
          {domain}
        </span>
      )}
      <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button type="button" title="Edit bookmark" className={iconBtn} onClick={startEdit}>
          <Pencil size={13} />
        </button>
        <button
          type="button"
          title="Delete bookmark"
          className={`${iconBtn} hover:text-red-600 dark:hover:text-red-400`}
          onClick={() => deleteBookmark(bookmark.id)}
        >
          <Trash2 size={13} />
        </button>
      </span>
    </div>
  )
}
