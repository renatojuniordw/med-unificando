import { defineConfig } from '@playwright/test'

// Stack E2E — Playwright (bootstrap via prompt setup-e2e, 2026-09-03).
// - baseURL: ambiente local de desenvolvimento (package.json → "dev": "next dev -p 11006")
// - retries: 0 local — decisão de retry é do pipeline CI (prompt ci-e2e)
// - reporter: html para uso local; CI define o reporter próprio
export default defineConfig({
  testDir: './e2e',
  retries: 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:11006',
  },
})
