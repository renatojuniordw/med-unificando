import { test, expect } from '@playwright/test'

// Jornada: Busca Avançada + Filtros (página /buscar-avancado)
// Happy path (busca por princípio ativo + filtro de situação) + falha (sem resultados).
test.describe('Busca Avançada', () => {
  test('busca com filtro retorna resultados na tabela', async ({ page }) => {
    await page.goto('/buscar-avancado')

    const input = page.getByTestId('search-query-input')
    await input.fill('sulpirida')

    await page.getByTestId('status-filter-ativo').click()
    await page.getByTestId('search-submit-button').click()

    await expect(page.getByTestId('medicine-table')).toBeVisible()
    await expect(page.getByTestId('medicine-row').first()).toBeVisible()
  })

  test('mostra estado vazio para combinação sem resultados', async ({ page }) => {
    await page.goto('/buscar-avancado')

    const input = page.getByTestId('search-query-input')
    await input.fill('zzqqxxtermoinexistente')
    await page.getByTestId('search-submit-button').click()

    await expect(page.getByText('Nenhum medicamento encontrado').first()).toBeVisible()
  })
})