import { describe, expect, it } from 'vitest'
import type { Note } from '../../types'
import { moveNoteIn, pinnedNotes, sortNotes } from './ordering'

/** Creation days ascending with the id, so `n1` is the OLDEST note. */
function note(id: string, extra: Partial<Note> = {}): Note {
  const day = String(10 + Number(id.slice(1))).padStart(2, '0')
  const at = `2026-09-${day}T08:00:00.000Z`
  return { id, text: `Note ${id}`, createdAt: at, updatedAt: at, ...extra }
}

const ids = (notes: Note[]) => notes.map((n) => n.id)

describe('sortNotes', () => {
  it('falls back to newest first when nothing has been reordered', () => {
    expect(ids(sortNotes([note('n1'), note('n3'), note('n2')]))).toEqual(['n3', 'n2', 'n1'])
  })

  it('puts ranked notes ahead of unranked ones, in rank order', () => {
    const notes = [note('n1'), note('n2'), note('n3', { order: 1 }), note('n4', { order: 0 })]
    expect(ids(sortNotes(notes))).toEqual(['n4', 'n3', 'n2', 'n1'])
  })

  it('does not mutate its input', () => {
    const notes = [note('n1'), note('n2')]
    sortNotes(notes)
    expect(ids(notes)).toEqual(['n1', 'n2'])
  })

  it('keeps array order for notes captured in the same millisecond', () => {
    // addNote prepends, so array order already IS newest-first for a burst.
    const same = '2026-09-17T08:00:00.000Z'
    const notes = [
      { ...note('n2'), createdAt: same },
      { ...note('n1'), createdAt: same },
      { ...note('n3'), createdAt: same },
    ]
    expect(ids(sortNotes(notes))).toEqual(['n2', 'n1', 'n3'])
  })
})

describe('moveNoteIn', () => {
  it('materializes a rank on every note the first time one moves', () => {
    // Display order starts n3, n2, n1 (newest first) — move n3 down one.
    const moved = moveNoteIn([note('n1'), note('n2'), note('n3')], 'n3', 1)
    expect(ids(sortNotes(moved))).toEqual(['n2', 'n3', 'n1'])
    expect(moved.every((n) => n.order !== undefined)).toBe(true)
  })

  it('keeps the array order untouched — only the ranks move', () => {
    const moved = moveNoteIn([note('n1'), note('n2'), note('n3')], 'n3', 1)
    expect(ids(moved)).toEqual(['n1', 'n2', 'n3'])
  })

  it('stays stable across repeated moves', () => {
    let notes = [note('n1'), note('n2'), note('n3')]
    notes = moveNoteIn(notes, 'n1', -1) // n3 n1 n2
    expect(ids(sortNotes(notes))).toEqual(['n3', 'n1', 'n2'])
    notes = moveNoteIn(notes, 'n1', -1) // n1 n3 n2
    expect(ids(sortNotes(notes))).toEqual(['n1', 'n3', 'n2'])
    notes = moveNoteIn(notes, 'n2', -1) // n1 n2 n3
    expect(ids(sortNotes(notes))).toEqual(['n1', 'n2', 'n3'])
  })

  it('returns the input unchanged at the ends and for an unknown id', () => {
    const notes = [note('n1'), note('n2'), note('n3')]
    expect(moveNoteIn(notes, 'n3', -1)).toBe(notes) // already first
    expect(moveNoteIn(notes, 'n1', 1)).toBe(notes) // already last
    expect(moveNoteIn(notes, 'nope', 1)).toBe(notes)
  })

  it('leaves updatedAt alone — a move is not an edit', () => {
    const before = [note('n1'), note('n2')]
    const after = moveNoteIn(before, 'n1', -1)
    expect(after.map((n) => n.updatedAt)).toEqual(before.map((n) => n.updatedAt))
  })
})

describe('pinnedNotes', () => {
  it('selects only pinned notes, in display order', () => {
    const notes = [
      note('n1', { pinned: true }),
      note('n2'),
      note('n3', { pinned: true, order: 0 }),
      note('n4', { pinned: false }),
    ]
    expect(ids(pinnedNotes(notes))).toEqual(['n3', 'n1'])
  })

  it('is empty when nothing is pinned', () => {
    expect(pinnedNotes([note('n1'), note('n2')])).toEqual([])
  })
})
