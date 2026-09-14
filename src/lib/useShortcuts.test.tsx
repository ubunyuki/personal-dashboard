import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useShortcuts } from './useShortcuts'
import { resetStores } from '../test/resetStores'
import { useUiStore } from '../store/uiStore'

function Harness() {
  useShortcuts()
  return <input aria-label="field" />
}

const mount = () => {
  resetStores()
  return render(<Harness />)
}

describe('useShortcuts', () => {
  it('n / t / b / ? reach their actions from an idle page', async () => {
    const user = userEvent.setup()
    mount()

    await user.keyboard('t')
    expect(useUiStore.getState().editingTask).toBe('new')
    useUiStore.getState().closeTaskEditor()

    await user.keyboard('n')
    expect(useUiStore.getState().activeTab).toBe('notes')
    expect(useUiStore.getState().noteFocusToken).toBe(1)

    await user.keyboard('b')
    expect(useUiStore.getState().activeTab).toBe('bookmarks')
    expect(useUiStore.getState().bookmarkFocusToken).toBe(1)

    await user.keyboard('?')
    expect(useUiStore.getState().helpOpen).toBe(true)
  })

  it('ignores chords with modifier keys', async () => {
    const user = userEvent.setup()
    mount()

    await user.keyboard('{Control>}t{/Control}')
    await user.keyboard('{Alt>}n{/Alt}')

    expect(useUiStore.getState().editingTask).toBeNull()
    expect(useUiStore.getState().activeTab).toBe('dashboard')
  })

  it('is inert while typing in a form control', async () => {
    const user = userEvent.setup()
    mount()

    await user.click(screen.getByLabelText('field'))
    await user.keyboard('t')

    expect(useUiStore.getState().editingTask).toBeNull()
    expect(screen.getByLabelText<HTMLInputElement>('field').value).toBe('t')
  })

  it('is inert while an overlay is open', async () => {
    const user = userEvent.setup()
    mount()
    useUiStore.setState({ helpOpen: true })

    await user.keyboard('t')
    expect(useUiStore.getState().editingTask).toBeNull()

    useUiStore.setState({ helpOpen: false, whiteboardOpen: true })
    await user.keyboard('t')
    expect(useUiStore.getState().editingTask).toBeNull()
  })
})
