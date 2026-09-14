/**
 * Setup for the `dom` vitest project only (see vite.config.ts) — the node
 * `unit` project must never load this: Testing Library's cleanup needs a
 * `document`, and the stubs below patch browser globals.
 */
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Vitest globals are not enabled in this repo, so RTL's auto-cleanup never
// registers itself — unmount everything after each test explicitly.
afterEach(() => {
  cleanup()
})

// ---- jsdom gaps this app actually hits ----

// useThemeEffect queries the OS colour scheme on every <App /> render.
Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList,
})

// NoteCapture observes its textarea; jsdom has no ResizeObserver.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

// jsdom implements neither; list keyboard-nav (palette) calls the former.
Element.prototype.scrollIntoView = () => {}

// newId() runs on every add* store action. jsdom usually provides this —
// keep a guarded fallback so a runtime change can't take the suite down.
// Sequential, because the app relies on ids being unique.
if (typeof globalThis.crypto?.randomUUID !== 'function') {
  let uuidCounter = 0
  const cryptoObj = (globalThis.crypto ?? {}) as Crypto
  Object.defineProperty(cryptoObj, 'randomUUID', {
    configurable: true,
    value: () => `00000000-0000-4000-8000-${String(++uuidCounter).padStart(12, '0')}`,
  })
  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: cryptoObj })
  }
}

// Copy-to-clipboard (weekly review). Tests spy on writeText and restoreMocks
// puts the spy back; `configurable` keeps that possible.
Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: { writeText: vi.fn(async () => {}) },
})

// No test may silently reach the network (weather, favicons). Anything that
// really needs fetch stubs it explicitly in the test.
globalThis.fetch = vi.fn(() =>
  Promise.reject(new Error('fetch is disabled in tests — stub it explicitly')),
) as unknown as typeof fetch
