import type { Note } from '../../types'

/**
 * Note order and pinning. Both fields are optional and live inside array
 * elements, so a rehydrate at the same schema version backfills neither —
 * every read here goes through a fallback, never a bare `note.order`.
 *
 * `order` is an explicit rank that only exists once the user has moved
 * something. Until then notes have no rank at all and fall back to newest
 * first, which is what every existing view already showed.
 */

/**
 * Newest first — the tiebreak for notes the user has never reordered.
 * Notes captured in the same millisecond compare equal and therefore keep
 * their array position (Array.prototype.sort is stable), which for notes is
 * insertion order newest-first, because addNote prepends. Comparing ids
 * instead would scramble a rapid burst into UUID order.
 */
function byNewest(a: Note, b: Note): number {
  return b.createdAt.localeCompare(a.createdAt)
}

/**
 * THE display order, used by every surface that lists notes, so the Notes
 * page and the dashboard can no longer disagree about what "first" means.
 * Ranked notes lead, in rank order; unranked ones trail, newest first —
 * the same precedence deriveProjects gives ProjectMeta.order.
 */
export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    const oa = a.order
    const ob = b.order
    if (oa !== undefined && ob !== undefined) return oa - ob || byNewest(a, b)
    if (oa !== undefined) return -1
    if (ob !== undefined) return 1
    return byNewest(a, b)
  })
}

/** Pinned notes in display order — the dashboard tile's whole content. */
export function pinnedNotes(notes: Note[]): Note[] {
  return sortNotes(notes.filter((n) => n.pinned === true))
}

/**
 * Pure core of moveNote: swaps the note with its neighbour in the CURRENT
 * display order, then materializes order = index onto every note — so a
 * first move gives the whole list an explicit rank and later moves stay
 * stable. Returns the input array unchanged when the move is a no-op, which
 * is how the store action knows to skip the write.
 *
 * Deliberately leaves updatedAt alone: reordering is not an edit of the
 * note, and bumping it would rewrite the "last edited" stamp the cards show.
 */
export function moveNoteIn(notes: Note[], id: string, delta: -1 | 1): Note[] {
  const order = sortNotes(notes)
  const i = order.findIndex((n) => n.id === id)
  const j = i + delta
  if (i < 0 || j < 0 || j >= order.length) return notes
  ;[order[i], order[j]] = [order[j], order[i]]
  const rank = new Map(order.map((n, index) => [n.id, index]))
  return notes.map((n) => {
    const r = rank.get(n.id)
    return r === undefined || n.order === r ? n : { ...n, order: r }
  })
}
