import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskRow } from './TaskRow'
import { resetStores } from '../../test/resetStores'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'

const seedTask = (title: string) => {
  resetStores()
  return useAppStore.getState().addTask({ title })
}

/** The status button sits inside the clickable row; its stopPropagation is
 *  what keeps a status click from ALSO opening the editor. */
describe('TaskRow', () => {
  it('status click advances status without opening the editor', async () => {
    const user = userEvent.setup()
    const task = seedTask('Alpha')
    render(<TaskRow task={task} now={new Date()} />)

    await user.click(screen.getByRole('button', { name: /click for in progress/i }))

    expect(useAppStore.getState().tasks[0]?.status).toBe('in-progress')
    expect(useUiStore.getState().editingTask).toBeNull()
  })

  it('row click opens the editor on the task id', async () => {
    const user = userEvent.setup()
    const task = seedTask('Alpha')
    render(<TaskRow task={task} now={new Date()} />)

    await user.click(screen.getByText('Alpha'))

    expect(useUiStore.getState().editingTask).toBe(task.id)
    // Row click must not have touched the status.
    expect(useAppStore.getState().tasks[0]?.status).toBe('todo')
  })
})
