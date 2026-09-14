import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskEditor } from './TaskEditor'
import { resetStores } from '../../test/resetStores'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

/** Mirrors App.tsx, which mounts the editor keyed by the editing id. */
const openEditor = (editing: string | 'new') => {
  useUiStore.setState({ editingTask: editing })
  return render(<TaskEditor key={editing} />)
}

describe('TaskEditor', () => {
  it('drops dueTime when dueDate is cleared before saving', async () => {
    const user = userEvent.setup()
    resetStores()
    openEditor('new')

    await user.type(screen.getByLabelText('Title'), 'With time but no date')
    await user.type(screen.getByLabelText('Due date'), '2026-09-20')
    await user.type(screen.getByLabelText('Due time'), '14:30')
    await user.clear(screen.getByLabelText('Due date'))
    await user.click(screen.getByRole('button', { name: 'Add task' }))

    const task = useAppStore.getState().tasks[0]
    expect(task?.title).toBe('With time but no date')
    expect(task?.dueDate).toBeUndefined()
    expect(task?.dueTime).toBeUndefined()
    expect(useUiStore.getState().editingTask).toBeNull()
  })

  it('sets completedAt on done and clears it on un-done', async () => {
    const user = userEvent.setup()
    resetStores()
    const task = useAppStore.getState().addTask({ title: 'Finish me' })

    let view = openEditor(task.id)
    await user.selectOptions(screen.getByLabelText('Status'), 'done')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(useAppStore.getState().tasks[0]?.completedAt).toBeTruthy()
    view.unmount()

    view = openEditor(task.id)
    await user.selectOptions(screen.getByLabelText('Status'), 'todo')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(useAppStore.getState().tasks[0]?.completedAt).toBeUndefined()
    view.unmount()
  })
})
