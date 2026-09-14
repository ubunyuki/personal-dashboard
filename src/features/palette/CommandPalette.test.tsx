import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App'
import { renderWithStores } from '../../test/renderApp'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

const seed = () => {
  const add = useAppStore.getState()
  add.addTask({ title: 'Quarterly report' })
  add.addTask({ title: 'Fix the header' })
  add.addNote('Vendor call notes')
}

describe('CommandPalette', () => {
  it('Ctrl+K opens it — even from inside a text input — and Escape closes', async () => {
    const user = userEvent.setup()
    renderWithStores(<App />, seed)

    // Focus the quick-add input on the Tasks tab, then hit the chord.
    await user.click(screen.getByRole('button', { name: 'Tasks' }))
    await user.click(screen.getByPlaceholderText('Add a task — Enter to save'))
    await user.keyboard('{Control>}k{/Control}')
    expect(useUiStore.getState().paletteOpen).toBe(true)
    expect(screen.getByRole('combobox', { name: 'Search' })).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(useUiStore.getState().paletteOpen).toBe(false)
  })

  it('letter shortcuts are dead while it is open', async () => {
    const user = userEvent.setup()
    renderWithStores(<App />, seed)
    await user.keyboard('{Control>}k{/Control}')
    // 't' must type into the query, not open the task editor.
    await user.keyboard('t')
    expect(useUiStore.getState().editingTask).toBeNull()
    expect(screen.getByRole('combobox', { name: 'Search' })).toHaveValue('t')
  })

  it('arrow keys move the selection and Enter opens the chosen task', async () => {
    const user = userEvent.setup()
    renderWithStores(<App />, seed)
    const tasks = useAppStore.getState().tasks
    const report = tasks.find((t) => t.title === 'Quarterly report')!

    await user.keyboard('{Control>}k{/Control}')
    await user.keyboard('quarterly')
    // Best hit is the task; it starts selected.
    const selected = screen.getByRole('option', { selected: true })
    expect(selected).toHaveTextContent('Quarterly report')

    await user.keyboard('{Enter}')
    expect(useUiStore.getState().paletteOpen).toBe(false)
    expect(useUiStore.getState().editingTask).toBe(report.id)
  })

  it('selection wraps across group boundaries with the arrows', async () => {
    const user = userEvent.setup()
    renderWithStores(<App />, seed)
    await user.keyboard('{Control>}k{/Control}')
    await user.keyboard('e')

    const options = screen.getAllByRole('option')
    expect(options.length).toBeGreaterThan(1)
    // Walk the whole list: selection must land on every option once…
    for (let i = 1; i < options.length; i++) {
      await user.keyboard('{ArrowDown}')
      expect(screen.getByRole('option', { selected: true })).toBe(options[i])
    }
    // …and wrap back to the first.
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('option', { selected: true })).toBe(options[0])
    // ArrowUp wraps backwards to the last.
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('option', { selected: true })).toBe(options[options.length - 1])
  })

  it('running a note result switches to Notes and marks the note', async () => {
    const user = userEvent.setup()
    renderWithStores(<App />, seed)
    const noteId = useAppStore.getState().notes[0].id

    await user.keyboard('{Control>}k{/Control}')
    await user.keyboard('vendor')
    await user.keyboard('{Enter}')

    expect(useUiStore.getState().activeTab).toBe('notes')
    expect(useUiStore.getState().noteFocusId).toBe(noteId)
    // The card renders ring-highlighted on the Notes page.
    expect(document.getElementById(`note-${noteId}`)?.className).toContain('ring-2')
  })
})
