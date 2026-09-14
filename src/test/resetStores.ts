import { useAppStore } from '../store/appStore'
import { initialUiState, useUiStore } from '../store/uiStore'
import { defaultAppData } from '../store/migrations'

/**
 * Reset both stores between tests. Merge-set (the same trick replaceAll
 * uses) so the store actions survive the reset. Weather is disabled so no
 * component tries to fetch, and localStorage is wiped so persist state
 * can't leak from a previous test in the same file.
 */
export function resetStores(): void {
  const data = defaultAppData()
  data.settings.weather.enabled = false
  useAppStore.setState(data)
  useUiStore.setState(initialUiState())
  localStorage.clear()
}
