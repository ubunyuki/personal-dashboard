/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

/** Short commit sha, injected at build time by vite.config.ts from whichever
 *  variable the host sets — or 'dev' locally. */
declare const __BUILD_ID__: string
