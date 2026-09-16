# Outstanding items — WorkDesk v1.4.0 round

Single home for everything flagged during the M23–M31 batch that was **not**
fixed as part of the milestone that raised it. Nothing here blocks a commit;
they are collected so they can be worked through in one sitting.

Status key: `[ ]` open · `[x]` done · `[~]` accepted, no action intended.

Last updated: 2026-09-17 (during M30).

---

## 1. Manual verification still owed

These are the plan's "manual checks that tests cannot cover". Each needs a
running `npm run dev` and a human looking at the screen.

- [ ] **A. Warnings do not re-notify.** Leave the app open 10 minutes against
  the live (quiet) HKO endpoint; the network panel must show **one request per
  minute** and **zero** notifications. At a 60s cadence a re-notify bug would
  otherwise only surface during an actual typhoon.
  *(Plan check 4, second half — M26.)*
- [ ] **B. Warnings do notify, once.** Seed a fake previous state
  (`pwd:hko-warnings` in localStorage) and confirm the in-app alert, the chime
  and the title flash each fire **exactly once**, not on every poll.
  *(Plan check 4, first half — M26.)*
- [ ] **C. Narrow viewport.** Below 640px only the status bar scrolls
  horizontally; the page itself does not, and the main content stays centred.
  *(Plan check 1 — M23. Re-check after M30, which adds a fifth tab.)*
- [ ] **D. Old backup restores.** Restore a pre-change (v3) backup file and
  confirm the v3 → v5 path lands `weekStartsOn: 0` and converts single project
  tags into arrays. *(Plan check 2 — M24/M28.)*
- [ ] **E. Calendar colours.** Sundays and gazetted holidays render red under
  **both** week-start settings; specifically check the Apr 3–7 2026 five-day
  block. *(Plan check 3 — M25.)*
- [ ] **F. Bus polling cadence.** Add a stop, confirm ETAs refresh on a 60s
  cadence and that polling **stops** while the tab is hidden (unlike the
  warning poll, which deliberately keeps running). *(Plan check 5 — M30.)*
- [ ] **G. Nothing operator-owned is persisted.** `pwd:app` in localStorage
  contains no bus route/stop cache, and an exported envelope contains
  `busStops` and `dashboardLayout` but **no** cached API data.
  *(Plan check 6 — M30.)*

## 2. Lint warnings

`npm run lint` is green in the sense that nothing fails, but it reports:

- [ ] **H. `react(only-export-components)` ×2 in
  `src/features/dashboard/tiles.tsx`** — the file defines `MetricsTile` and
  `TaskBucketsTile` alongside the exported `TILE_REGISTRY`. Same class as the
  pre-existing warning at `src/components/ui/Card.tsx:26`, and only affects
  Fast Refresh granularity in dev. Fix by moving the two local tiles into
  their own files, or suppress both together with Card.tsx.
  *(M30's equivalent warnings were resolved as they appeared — the operator
  class maps moved to `src/features/bus/operator.ts` — so this is the whole
  of it.)*
- [~] **I. Pre-existing: `ExcalidrawCanvas.tsx:96` ref access in cleanup** and
  **`WhiteboardOverlay.tsx:62` set-state-in-effect.** Predate this round;
  listed only so the lint output is fully accounted for.

## 3. Build warnings

- [ ] **J. Chunks over 500 kB.** `percentages-*` ≈ 1.13 MB and
  `subset-shared.chunk` ≈ 1.82 MB, both from `@excalidraw/excalidraw`. They are
  lazily loaded, so first paint is unaffected — but the warning is noise on
  every build. Either raise `build.chunkSizeWarningLimit` with a comment saying
  why, or confirm the Excalidraw chunks really are behind a dynamic import and
  document that instead.

## 4. Recurring maintenance

- [ ] **K. Annual `gen-hk-holidays` re-run.** `src/lib/dates/hkHolidays.ts` is
  generated from the 1823 iCal feed and currently covers **2025–2027**. Next
  year's holidays are gazetted each May, so re-run
  `node scripts/gen-hk-holidays.mjs` after May 2027 at the latest. To be
  written into `README.md` as part of M31.

## 5. Deferred features

- [~] **L. Encrypted sync link.** Out of this batch by decision; the full design
  is Appendix A of the plan
  (`~/.claude/plans/feature-change-or-new-validated-spark.md`). Needs a server,
  so it is the only item in the original list of ten that is not backendless.
  Roughly one milestone for the client and one for the Netlify Function.
