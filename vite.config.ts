import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'WorkDesk — personal work dashboard',
        short_name: 'WorkDesk',
        description: 'Status bar, tasks, notes, calendar and whiteboard in one place.',
        theme_color: '#4f46e5',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Default 2 MiB would silently skip the Excalidraw chunk (M7).
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  define: {
    __BUILD_ID__: JSON.stringify((process.env.COMMIT_REF ?? 'dev').slice(0, 7)),
  },
  test: {
    passWithNoTests: true,
    // Pinned so local-calendar tests (weekly review bucketing, due dates)
    // mean the same thing on a UTC CI box as on the Hong Kong dev machine.
    env: { TZ: 'Asia/Hong_Kong' },
    // Two projects split by extension: pure logic stays fast in node; only
    // component tests (.tsx) pay for jsdom. `extends: true` is load-bearing —
    // rendering <App /> needs the root `define` (__BUILD_ID__) and the
    // VitePWA plugin (it supplies the virtual:pwa-register/react module).
    projects: [
      {
        extends: true,
        test: { name: 'unit', environment: 'node', include: ['src/**/*.test.ts'] },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./src/test/setup.ts'],
          restoreMocks: true,
        },
      },
    ],
  },
})
