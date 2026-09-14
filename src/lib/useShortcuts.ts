import { useEffect } from 'react'
import { useUiStore } from '../store/uiStore'

/** Global shortcuts: N = new note, T = new task, B = bookmarks, ? = help.
 *  Inactive while typing or while any overlay (editor, settings, help,
 *  whiteboard, restore) is open. */
export function useShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const ui = useUiStore.getState()
      if (
        ui.editingTask !== null ||
        ui.settingsOpen ||
        ui.helpOpen ||
        ui.whiteboardOpen ||
        ui.restorePrompt
      )
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
      } else if (e.key === '?') {
        e.preventDefault()
        ui.openHelp()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
