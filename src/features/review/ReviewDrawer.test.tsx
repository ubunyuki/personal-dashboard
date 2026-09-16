import { describe, expect, it } from 'vitest'
import { format } from 'date-fns'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../../test/renderApp'
import { useAppStore } from '../../store/appStore'

/**
 * The wiring test: dashboard tile → uiStore → drawer → buildReview. Bucketing
 * across the UTC/local boundary is pinned in review.test.ts; here the task is
 * completed at the real "now", so it always falls inside the current week.
 */
describe('ReviewDrawer', () => {
  const seedCompleted = (title: string, ...projects: string[]) => () => {
    const task = useAppStore.getState().addTask({ title, projects })
    useAppStore.getState().updateTask(task.id, { status: 'done' })
  }

  it('opens from the Done this week tile and lists the completion under today', async () => {
    const user = userEvent.setup()
    renderApp(seedCompleted('Ship the quarterly report', 'reporting'))

    await user.click(screen.getByRole('button', { name: /Done this week/ }))

    const drawer = screen.getByRole('dialog', { name: 'Weekly review' })
    expect(within(drawer).getByText(format(new Date(), 'EEE d MMM'))).toBeInTheDocument()
    expect(within(drawer).getByText('Ship the quarterly report')).toBeInTheDocument()
    expect(within(drawer).getByText('#reporting')).toBeInTheDocument()
  })

  it('regroups by project and closes on Escape', async () => {
    const user = userEvent.setup()
    renderApp(seedCompleted('Ship the quarterly report', 'reporting'))

    await user.click(screen.getByRole('button', { name: /Done this week/ }))
    await user.click(screen.getByRole('button', { name: 'By project' }))

    const drawer = screen.getByRole('dialog', { name: 'Weekly review' })
    // The project is the heading now, so it no longer trails the bullet.
    expect(within(drawer).getByRole('heading', { name: '#reporting' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Weekly review' })).not.toBeInTheDocument()
  })
})
