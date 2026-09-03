import { test, expect } from '@playwright/test'

// Jornada: Comparação de Medicamentos (/compare)
// Happy path (adiciona 2 pelo autocomplete e compara) + falha (tela vazia).
test.describe('Comparação de Medicamentos', () => {
  test('adiciona dois medicamentos e exibe a tabela de comparação', async ({ page }) => {
    await page.goto('/compare')

    const search = page.getByTestId('compare-search-input')
    await search.fill('sulpirida')
    await expect(page.getByTestId('compare-search-option').first()).toBeVisible()
    await page.getByTestId('compare-search-option').first().click()

    await search.fill('paracetamol')
    await expect(page.getByTestId('compare-search-option').first()).toBeVisible()
    await page.getByTestId('compare-search-option').first().click()

    await expect(page.getByTestId('compare-table')).toBeVisible()
  })

  test('mostra estado vazio quando não há medicamentos selecionados', async ({ page }) => {
    await page.goto('/compare')

    await expect(page.getByTestId('compare-empty-state')).toBeVisible()
    await expect(page.getByText('Nenhum medicamento selecionado')).toBeVisible()
  })
})