import { test, expect } from '@playwright/test'

// Jornada: Referências (/referencias)
// Happy path (busca por referência → itens) + falha (termo sem correspondência).
test.describe('Referências', () => {
  test('busca uma referência e lista os medicamentos correspondentes', async ({ page }) => {
    await page.goto('/referencias')

    const input = page.getByTestId('reference-search-input')
    await input.fill('sulpirida')

    await expect(page.getByTestId('reference-search-item').first()).toBeVisible()
  })

  test('mostra estado vazio para referência inexistente', async ({ page }) => {
    await page.goto('/referencias')

    const input = page.getByTestId('reference-search-input')
    await input.fill('zzqqxxtermoinexistente')

    await expect(page.getByText(/Nenhuma referência encontrada/)).toBeVisible()
  })
})