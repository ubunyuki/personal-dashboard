import { useEffect } from 'react'
import { useUiStore } from '../store/uiStore'

/** Global shortcuts: Ctrl/⌘+K or / = palette, N = new note, T = new task,
 *  B = bookmarks, ? = help. The letters are inactive while typing or while
 *  any overlay (palette, editor, settings, help, whiteboard, restore) is
 *  open; Ctrl+K works even from inside a text field — opening the palette
 *  mid-typing is expected — but not over the whiteboard (Excalidraw owns
 *  its keyboard) or the restore prompt. */
export function useShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ui = useUiStore.getState()
      // Above the modifier guard on purpose — it IS a modifier chord.
      if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) {
        if (ui.whiteboardOpen || ui.restorePrompt) return
        e.preventDefault()
        ui.togglePalette()
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (
        ui.paletteOpen ||
        ui.reviewOpen ||
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
      } else if (e.key === '/') {
        // Secondary opener; below the typing guard so "/" still types.
        e.preventDefault()
        ui.togglePalette()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
