import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotesPage } from './NotesPage'
import { renderApp, renderWithStores } from '../../test/renderApp'
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

describe('NoteCard reordering', () => {
  it('moves a note down the page and leaves the rest in place', async () => {
    const user = userEvent.setup()
    renderWithStores(<NotesPage />, () => {
      const add = useAppStore.getState().addNote
      add('oldest')
      add('middle')
      add('newest')
    })
    // Default order is newest first, and only the ends disable their arrow.
    const order = () => screen.getAllByRole('article').map((a) => a.querySelector('p')?.textContent)
    expect(order()).toEqual(['newest', 'middle', 'oldest'])

    await user.click(screen.getAllByTitle('Move note down')[0])
    expect(order()).toEqual(['middle', 'newest', 'oldest'])
    // Every note now carries an explicit rank, so later moves stay stable.
    expect(useAppStore.getState().notes.every((n) => n.order !== undefined)).toBe(true)

    await user.click(screen.getAllByTitle('Move note up')[2])
    expect(order()).toEqual(['middle', 'oldest', 'newest'])
  })

  it('disables the arrows at the ends of the list', () => {
    renderWithStores(<NotesPage />, () => {
      useAppStore.getState().addNote('only one')
    })
    expect(screen.getByTitle('Move note up')).toBeDisabled()
    expect(screen.getByTitle('Move note down')).toBeDisabled()
  })
})

describe('note pinning', () => {
  it('puts the pinned note on the dashboard, in full, and takes it off again', async () => {
    const user = userEvent.setup()
    renderApp(() => {
      useAppStore.getState().addNote('Wifi password\nhunter2')
    })
    // Nothing pinned yet: the tile is absent rather than empty.
    expect(screen.queryByTitle('Open in Notes')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Notes' }))
    await user.click(screen.getByTitle('Pin to the dashboard'))
    await user.click(screen.getByRole('button', { name: 'Dashboard' }))

    // Full text, not just the first line the Recent notes tile shows.
    expect(screen.getByTitle('Open in Notes')).toHaveTextContent('Wifi password hunter2')

    await user.click(screen.getByRole('button', { name: 'Notes' }))
    await user.click(screen.getByTitle('Unpin from the dashboard'))
    await user.click(screen.getByRole('button', { name: 'Dashboard' }))
    expect(screen.queryByTitle('Open in Notes')).toBeNull()
  })
})
