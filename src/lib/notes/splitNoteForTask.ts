/** Note→task conversion: first line becomes the title, the rest the description. */
export function splitNoteForTask(text: string): { title: string; description: string } {
  const trimmed = text.trim()
  const idx = trimmed.indexOf('\n')
  if (idx === -1) return { title: trimmed, description: '' }
  return { title: trimmed.slice(0, idx).trim(), description: trimmed.slice(idx + 1).trim() }
}
