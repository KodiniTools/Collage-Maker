import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/**
 * E2E-Smoke-Tests (Muster: KodiniTools/Playlist-Generator).
 * Lokal gegen den Dev-Server, auf CI gegen `vite preview` (Production-Build).
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  /* test.only auf CI ist ein Fehler */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    actionTimeout: 0,
    /* Base URL inkl. Vite `base`; relativ navigieren, z. B. `page.goto('./editor')`. */
    baseURL: process.env.CI
      ? 'http://localhost:4173/collagemaker/'
      : 'http://localhost:5173/collagemaker/',
    trace: 'on-first-retry',
    headless: !!process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: {
    command: process.env.CI ? 'npm run preview' : 'npm run dev',
    port: process.env.CI ? 4173 : 5173,
    reuseExistingServer: !process.env.CI,
  },
})
