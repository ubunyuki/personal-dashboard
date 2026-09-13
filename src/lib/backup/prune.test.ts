import { describe, expect, it } from 'vitest'
import { selectFilesToDelete, snapshotFileName, SNAPSHOT_RE } from './prune'

const snap = (s: string) => `dashboard-backup-${s}.json`

describe('snapshotFileName', () => {
  it('produces names that match the snapshot pattern and contain no colons', () => {
    const name = snapshotFileName(new Date(2026, 8, 14, 18, 30, 5))
    expect(name).toBe('dashboard-backup-2026-09-14_18-30-05.json')
    expect(SNAPSHOT_RE.test(name)).toBe(true)
    expect(name).not.toContain(':')
  })

  it('sorts chronologically as plain strings', () => {
    const older = snapshotFileName(new Date(2026, 8, 14, 9, 5, 0))
    const newer = snapshotFileName(new Date(2026, 8, 14, 18, 30, 0))
    expect(older < newer).toBe(true)
  })
})

describe('selectFilesToDelete', () => {
  it('ignores files that are not snapshots', () => {
    const names = ['random.txt', 'dashboard-backup-bad.json', snap('2026-09-01_10-00-00')]
    expect(selectFilesToDelete(names, 1)).toEqual([])
  })

  it('keeps the newest N by name order', () => {
    const names = [
      snap('2026-09-03_10-00-00'),
      snap('2026-09-01_10-00-00'),
      'notes.docx',
      snap('2026-09-04_10-00-00'),
      snap('2026-09-02_10-00-00'),
    ]
    expect(selectFilesToDelete(names, 3)).toEqual([snap('2026-09-01_10-00-00')])
    expect(selectFilesToDelete(names, 2)).toEqual([
      snap('2026-09-01_10-00-00'),
      snap('2026-09-02_10-00-00'),
    ])
  })

  it('deletes nothing when at or under the limit', () => {
    const names = [snap('2026-09-01_10-00-00'), snap('2026-09-02_10-00-00')]
    expect(selectFilesToDelete(names, 2)).toEqual([])
    expect(selectFilesToDelete(names, 30)).toEqual([])
  })
})
