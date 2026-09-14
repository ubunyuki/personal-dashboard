# WorkDesk — personal work dashboard

A single-user "mini OS" dashboard for daily work: status bar (live clock,
Hong Kong Observatory weather, reminders bell, month calendar), a task board,
quick notes that convert into tasks, grouped web bookmarks, and an embedded
Excalidraw whiteboard. No backend and no database — data lives in the
browser, protected by an automatic backup system that writes JSON snapshots
to a OneDrive folder.

## Features

- **Dashboard** — overdue / due-today / due-this-week / in-progress buckets,
  metric tiles, upcoming events, recent notes + bookmarks; each section has
  its own accent colour.
- **Tasks** — quick add, filters/sorts, editor (status, priority, due
  date+time, project tag), status cycling on rows.
- **Notes** — instant capture (`Ctrl+Enter`; drag-bar resizable box with
  remembered height, drafts survive tab switches), inline edit,
  convert-to-task (first line → title, rest → description, linked both
  ways).
- **Bookmarks** — save links into groups (each with its own colour,
  reorderable), search across them, favicons, open-in-new-tab; included
  in backups.
- **Calendar** — click the clock to open a month popover plotting task
  deadlines + manual events, inline event add per day.
- **Reminders bell** — overdue + due-soon tasks and today's events.
- **Whiteboard** — Excalidraw, multiple boards, autosave, PNG/SVG download.
- **Weather** — HKO official readings or Open-Meteo city; chip shows
  location + temperature + humidity (full-name or short-code label).
  Click the place name to switch location; click the readings for the
  HKO site.
- **Help** — in-app user guide (`?` or the help button next to Settings).
- **Backups** — auto-snapshots to a picked folder (hourly on change, keeps
  newest 30), staleness nudges, manual export/restore, storage-clear tripwire.

Keyboard: `N` new note · `T` new task · `B` bookmarks · `?` help ·
`Ctrl+Enter` save note · `Esc` close.

## Develop (Mac)

```sh
npm install
npm run dev        # http://localhost:5173
npx vitest run     # 51 unit tests
npm run build && npm run preview
```

## Deploy

Push to `main` → Netlify builds via `netlify.toml` (tests gate the deploy).
Add `[skip netlify]` to a commit subject to push without spending a build.
Rollback: `git revert`, or re-publish any previous deploy in the Netlify UI.

## Work laptop setup (Windows 11 / Edge)

1. Open the Netlify URL in Edge.
2. Edge menu → Apps → **Install this site as an app** (own window + protects
   browser storage from eviction).
3. ⚙️ Settings → Backups → **Choose backup folder…** → pick a folder inside
   OneDrive. Verify a `dashboard-backup-….json` file appears and syncs.
4. If the weather chip shows “—”: the proxy may block
   `data.weather.gov.hk` — switch the source to Open-Meteo in Settings.

**Restore drill (worth doing once):** Settings → Export backup file, then
Edge → site settings → clear data → reopen the app → “Restore from a backup
file” → pick the export → everything returns.
