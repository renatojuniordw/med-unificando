import { test, expect } from '@playwright/test'

// Jornada: Acesso Administrativo (login + área protegida)
// Happy path (credenciais válidas → /admin/import + dashboard) + falha (credenciais inválidas).
// As credenciais vêm do ambiente (.env → ADMIN_EMAIL/ADMIN_PASSWORD). Se ausentes, o teste é pulado.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ''

test.describe('Acesso Administrativo', () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'ADMIN_EMAIL/ADMIN_PASSWORD não definidos no ambiente')

  test('login com credenciais válidas acessa a área administrativa', async ({ page }) => {
    await page.goto('/admin/login')

    await page.getByTestId('login-email-input').fill(ADMIN_EMAIL)
    await page.getByTestId('login-password-input').fill(ADMIN_PASSWORD)
    await page.getByTestId('login-submit-button').click()

    await expect(page).toHaveURL(/\/admin\/import/)
    await expect(page.getByTestId('sync-card-action-button').first()).toBeVisible()

    // Área protegida adicional: dashboard administrativo exige sessão
    await page.goto('/dashboard')
    await expect(page.getByTestId('stat-card-total')).toBeVisible()
  })

  test('login com credenciais inválidas mostra erro e permanece na página', async ({ page }) => {
    await page.goto('/admin/login')

    await page.getByTestId('login-email-input').fill(ADMIN_EMAIL)
    await page.getByTestId('login-password-input').fill('senha-incorreta-12345')
    await page.getByTestId('login-submit-button').click()

    await expect(page.getByTestId('login-error')).toBeVisible()
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})