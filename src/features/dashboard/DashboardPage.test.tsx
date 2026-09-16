import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardPage } from './DashboardPage'
import { resetStores } from '../../test/resetStores'
import { useAppStore } from '../../store/appStore'

const tileIds = () => useAppStore.getState().dashboardLayout.map((t) => t.id)

describe('dashboard layout editing', () => {
  it('moves a tile, hides it, and keeps both in the persisted layout', async () => {
    const user = userEvent.setup()
    resetStores()
    const view = render(<DashboardPage />)

    // The arrows only exist in edit mode.
    expect(screen.queryByTitle('Move tile up')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Edit layout' }))

    const before = tileIds()
    await user.click(screen.getAllByTitle('Move tile down')[0])
    expect(tileIds().slice(0, 2)).toEqual([before[1], before[0]])

    // Hiding leaves the tile in place, so it is still listed while editing.
    await user.click(screen.getAllByTitle('Hide tile')[0])
    expect(useAppStore.getState().dashboardLayout[0]).toEqual({ id: before[1], visible: false })
    expect(tileIds()).toEqual([before[1], before[0], ...before.slice(2)])
    expect(screen.getByText('Hidden')).toBeInTheDocument()

    // …and out of the dashboard once editing ends.
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByText('Hidden')).toBeNull()
    view.unmount()
  })

  it('renders every tile a stale saved layout is missing', async () => {
    resetStores()
    useAppStore.setState({ dashboardLayout: [{ id: 'notes', visible: true }] })
    const user = userEvent.setup()
    const view = render(<DashboardPage />)

    await user.click(screen.getByRole('button', { name: 'Edit layout' }))
    expect(screen.getAllByTitle('Move tile up')).toHaveLength(6)

    // The saved tile keeps its place at the front; the rest are appended
    // behind it — so the first strip still belongs to notes.
    await user.click(screen.getAllByTitle('Hide tile')[0])
    expect(useAppStore.getState().dashboardLayout[0]).toEqual({ id: 'notes', visible: false })
    expect(tileIds()).toHaveLength(6)
    view.unmount()
  })
})
