import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * A pinned dashboard tab never navigates, so the service worker would never
 * check for updates on its own — poll hourly so deploys reach eternal tabs.
 */
export function usePwaUpdatePoll(): void {
  useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      window.setInterval(() => void registration.update(), 60 * 60_000)
    },
  })
}
