import { test, expect } from '@playwright/test'

// PWA (Fase 6): manifest real com ícones + service worker registrado.
test.describe('PWA', () => {
  test('manifest expõe ícones instaláveis', async ({ page }) => {
    const res = await page.request.get('/manifest.json')
    expect(res.ok()).toBe(true)
    const manifest = await res.json()
    expect(manifest.icons?.length).toBeGreaterThanOrEqual(2)
    expect(manifest.display).toBe('standalone')
  })

  test('ícones PNG existem e são válidos', async ({ page }) => {
    for (const icon of ['/icon-192.png', '/icon-512.png']) {
      const res = await page.request.get(icon)
      expect(res.ok()).toBe(true)
      expect(res.headers()['content-type']).toContain('image/png')
    }
  })

  test('service worker é registrado em contexto secure (localhost)', async ({ page }) => {
    await page.goto('/')
    await expect
      .poll(async () => page.evaluate(() => navigator.serviceWorker?.controller ? 'controlled' : null), { timeout: 10_000 })
      .toBe('controlled')
  })
})