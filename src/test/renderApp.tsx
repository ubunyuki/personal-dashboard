import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import App from '../App'
import { resetStores } from './resetStores'

/**
 * Fresh stores, optional seed, then render. Seed through store actions
 * (addTask, addNote, …) rather than setState so timestamps and ids are
 * built the way production builds them.
 */
export function renderWithStores(ui: ReactElement, seed?: () => void) {
  resetStores()
  seed?.()
  return render(ui)
}

/** Full-app variant for tests that cross feature boundaries. */
export function renderApp(seed?: () => void) {
  return renderWithStores(<App />, seed)
}
