import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotesPage } from './NotesPage'
import { renderWithStores } from '../../test/renderApp'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

describe('NoteCard convert-to-task', () => {
  it('creates a linked task, opens its editor, and flips the card', async () => {
    const user = userEvent.setup()
    renderWithStores(<NotesPage />, () => {
      useAppStore.getState().addNote('Call the vendor\nAsk about the renewal quote')
    })

    await user.click(screen.getByRole('button', { name: /convert to task/i }))

    const { tasks, notes } = useAppStore.getState()
    expect(tasks[0]?.title).toBe('Call the vendor')
    expect(tasks[0]?.description).toBe('Ask about the renewal quote')
    expect(tasks[0]?.sourceNoteId).toBe(notes[0]?.id)
    expect(notes[0]?.convertedToTaskId).toBe(tasks[0]?.id)
    // Editor opened on the new task…
    expect(useUiStore.getState().editingTask).toBe(tasks[0]?.id)
    // …and the card now shows the converted state instead of the action.
    expect(screen.getByRole('button', { name: /task created — open/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /convert to task/i })).toBeNull()
  })
})
