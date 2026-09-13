import { format } from 'date-fns'

export const KEEP_SNAPSHOTS = 30
export const SNAPSHOT_PREFIX = 'dashboard-backup-'
/** Windows-safe (no colons); lexicographic order == chronological order. */
export const SNAPSHOT_RE = /^dashboard-backup-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/

export function snapshotFileName(d: Date): string {
  return `${SNAPSHOT_PREFIX}${format(d, 'yyyy-MM-dd_HH-mm-ss')}.json`
}

/** Which files to delete so only the newest `keep` snapshots remain.
 *  Non-snapshot names are never touched. */
export function selectFilesToDelete(names: string[], keep: number): string[] {
  const snapshots = names.filter((n) => SNAPSHOT_RE.test(n)).sort()
  if (keep <= 0) return snapshots
  return snapshots.slice(0, Math.max(0, snapshots.length - keep))
}
