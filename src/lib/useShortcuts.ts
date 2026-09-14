import { useEffect } from 'react'
import { useUiStore } from '../store/uiStore'

/** Global shortcuts: N = new note, T = new task, B = bookmarks. Inactive while
 *  typing or while any overlay (editor, settings, whiteboard, restore) is open. */
export function useShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const ui = useUiStore.getState()
      if (ui.editingTask !== null || ui.settingsOpen || ui.whiteboardOpen || ui.restorePrompt)
        return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        ui.focusNoteCapture()
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        ui.openTaskEditor()
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault()
        ui.focusBookmarks()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
