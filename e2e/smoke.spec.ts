import { test, expect } from '@playwright/test'

// Smoke test mínimo para validar a instalação da stack E2E.
// Specs reais (jornadas, fail paths) são escopo do prompt `testes-e2e`.
test('home carrega e exibe o título principal', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/Med Unificando/)
  await expect(
    page.getByRole('heading', { level: 1, name: /Medicamentos/ })
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Busca avançada/ })
  ).toBeVisible()
})