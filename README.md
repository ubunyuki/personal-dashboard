# WorkDesk — personal work dashboard

Mini-OS style dashboard: status bar (clock, weather, reminders, month calendar),
task board, quick notes with note→task conversion, and an Excalidraw whiteboard.
Single user, no backend — data lives in the browser, protected by JSON backups
written to a OneDrive folder.

## Develop

```sh
npm install
npm run dev
```

## Test & build

```sh
npx vitest run
npm run build && npm run preview
```

## Deploy

Push to `main` → Netlify builds via `netlify.toml` (tests must pass or the
previous deploy stays live).

## Work laptop setup (Windows 11 / Edge)

1. Open the Netlify URL in Edge.
2. Menu → Apps → “Install this site as an app” (improves storage persistence).
3. Settings (gear icon) → Backups → “Choose backup folder…” and pick a folder inside OneDrive. Snapshots are written automatically (hourly when data changed, newest 30 kept).
