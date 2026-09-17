# WorkDesk — personal work dashboard

A single-user "mini OS" dashboard for daily work: status bar (live clock,
Hong Kong Observatory weather and warnings, reminders bell, month calendar),
a task board, quick notes that convert into tasks, grouped web bookmarks,
Hong Kong bus arrivals, and an embedded Excalidraw whiteboard. No backend and
no database — data lives in the browser, protected by an automatic backup
system that writes JSON snapshots to a OneDrive folder.

## Features

- **Dashboard** — overdue / due-today / due-this-week / in-progress buckets,
  metric tiles, upcoming events, pinned notes, recent notes + bookmarks and
  bus arrivals; each section has its own accent colour. **Edit layout** shows
  arrows to reorder the tiles and an eye to hide the ones you never read.
- **Search & commands** — `Ctrl+K` (or `/`) opens one fuzzy search across
  tasks, notes, bookmarks and events, plus a command runner for every
  navigation and action.
- **Tasks & projects** — quick add, filters/sorts, editor (status, priority,
  due date+time, comma-separated project tags), status cycling on rows; group
  the board by project, each with its own colour, renameable and reorderable.
  A task with several tags shows up under every one of them.
- **Weekly review** — the “Done this week” tile opens a drawer of what you
  finished, grouped by day or by project, with events and a one-click
  copy as standup-ready markdown.
- **Notes** — instant capture (`Ctrl+Enter`; drag-bar resizable box with
  remembered height, drafts survive tab switches), inline edit, reorder with
  the arrows, pin a note onto the dashboard as its own tile, convert-to-task
  (first line → title, rest → description, linked both ways).
- **Bookmarks** — save links into groups (each with its own colour,
  reorderable), search across them, favicons, open-in-new-tab; included
  in backups.
- **Calendar** — click the clock to open a month popover plotting task
  deadlines + manual events, inline event add per day. Sundays and Hong Kong
  public holidays are red, and the holiday name shows on the day. The week
  starts on Sunday or Monday — Settings → Appearance.
- **Reminders bell** — overdue + due-soon tasks and today's events.
- **Whiteboard** — Excalidraw, multiple boards, autosave, PNG/SVG download.
- **Weather** — HKO official readings or Open-Meteo city; chip shows
  location + temperature + humidity (中文, full English name, or short code —
  Settings → Weather).
  Click the place name to switch location; click the readings for the
  HKO site.
- **Weather warnings** — hoisted HKO warnings, and the “expected” special
  weather tips that precede them, as a chip of the official icons. Checked
  every minute while the app is open, including in a background tab. A change
  raises an in-app alert, flashes the tab title, and — if you switch them on —
  plays a chime and posts a desktop notification. Once per change, never on a
  repeat check. Settings → Weather.
- **Bus arrivals** — the Bus tab searches KMB and Citybus routes, walks the
  stops of one and shows its live ETAs, which doubles as an ad-hoc lookup.
  Save a stop and it joins the dashboard tile, refreshing every minute while
  the tab is open. Stop and destination names read in 中文 by default —
  Settings → Appearance switches them to English.
- **Help** — in-app user guide (`?` or the help button next to Settings).
- **Backups** — auto-snapshots to a picked folder (hourly on change, keeps
  newest 30), staleness nudges, manual export/restore, storage-clear tripwire.

Keyboard: `Ctrl+K` search & commands · `N` new note · `T` new task ·
`B` bookmarks · `?` help · `Ctrl+Enter` save note · `Esc` close.

## Data sources

Weather and warnings come from the Hong Kong Observatory. Bus arrivals come
from KMB and Citybus real-time open data on data.gov.hk — the times are the
operators' own estimates, not a guarantee. Public holidays come from the 1823
government calendar feed. All are public open data, used under the
Government of the HKSAR's open-data terms.

## Develop (Mac)

```sh
npm install
npm run dev        # http://localhost:5173
npx vitest run     # 226 tests — `unit` in node, `dom` in jsdom
npm run build && npm run preview
```

## Bundled data

Four generators pull third-party data at development time and commit the
result, so the running app never fetches it, works offline and behind the work
proxy, and the tests stay deterministic:

- `node scripts/gen-hk-holidays.mjs` → `src/lib/dates/hkHolidays.ts` from the
  1823 feed, currently covering 2025–2027. **Re-run annually**: next year's
  holidays are gazetted each May, and the calendar quietly stops marking them
  past the last generated year. This is the only recurring upkeep the app has.
- `node scripts/gen-hko-station-names.mjs` → `src/lib/weather/stationNames.ts`,
  HKO's English station names paired with their Chinese ones. The feed carries
  no station ids, so the pairing is **by position** across two fetches of the
  same endpoint; the script refuses to write a table it cannot verify. Re-run
  when HKO adds a station.
- `node scripts/fetch-hko-icons.mjs` → `public/hko/*.gif`, the official
  warning icons behind the warning chip.
- `node scripts/gen-icons.mjs` → the PWA app icons.

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
5. If the Bus tab cannot load routes, the proxy is blocking
   `data.etabus.gov.hk` or `rt.data.gov.hk`. Nothing else depends on them.

**Restore drill (worth doing once):** Settings → Export backup file, then
Edge → site settings → clear data → reopen the app → “Restore from a backup
file” → pick the export → everything returns.
