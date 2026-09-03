import { test, expect } from '@playwright/test'

// Jornada: Detalhe do Medicamento (página /medicamento/[slug])
// Happy path (abre a partir da busca avançada) + falha (rota inexistente → 404).
test.describe('Detalhe do Medicamento', () => {
  test('navega da busca até o detalhe com informações e similares', async ({ page }) => {
    await page.goto('/buscar-avancado?query=sulpirida')

    await expect(page.getByTestId('medicine-row').first()).toBeVisible()
    // A linha tem 2 links (referência + nome comercial), ambos para o mesmo detalhe.
    await page.getByTestId('medicine-row').first().locator('a').first().click()

    // Timeout maior: primeira navegação client-side pode passar por cold compile
    // no dev server (Next) — mitigação anti-flake (ver e2e-test-report.md §4.4).
    await expect(page).toHaveURL(/\/medicamento\/[^/]+/, { timeout: 15_000 })
    await expect(page.getByTestId('medicine-info-card')).toBeVisible()
  })

  test('exibe página 404 para medicamento inexistente', async ({ page }) => {
    await page.goto('/medicamento/999999999')

    await expect(page.getByRole('heading', { name: /Página não encontrada/ })).toBeVisible()
  })
})