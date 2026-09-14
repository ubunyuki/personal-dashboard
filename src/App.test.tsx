import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from './test/renderApp'

/**
 * Harness smoke test: rendering the whole shell proves the dom project
 * inherits the root vite config — __BUILD_ID__ from `define` and the
 * virtual:pwa-register/react module from the VitePWA plugin (imported by
 * usePwaUpdatePoll). If `extends: true` ever breaks, this fails first.
 */
describe('App', () => {
  it('renders the shell with fresh stores', () => {
    renderApp()
    expect(screen.getByText(/^build /)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tasks' })).toBeInTheDocument()
    // Dashboard empty-state copy from TaskBucketWidget.
    expect(screen.getByText('Nothing overdue.')).toBeInTheDocument()
  })
})
