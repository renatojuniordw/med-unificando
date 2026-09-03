import { test, expect } from '@playwright/test'

// Jornada: Busca Semântica (fluxo principal da home — IA por descrição)
// Happy path + 2 estados de falha (input vazio bloqueia submit; termo sem match).
test.describe('Busca Semântica', () => {
  test('busca por descrição retorna resultados com relevância', async ({ page }) => {
    await page.goto('/')

    const input = page.getByTestId('semantic-search-input')
    await input.fill('dor de cabeça')
    await page.getByTestId('semantic-search-submit-button').click()

    await expect(page.getByTestId('semantic-search-result').first()).toBeVisible()
  })

  test('bloqueia busca vazia no botão submit (falha de UX)', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('semantic-search-submit-button')).toBeDisabled()
  })

  test('mostra estado vazio para termo sem correspondência', async ({ page }) => {
    await page.goto('/')

    const input = page.getByTestId('semantic-search-input')
    await input.fill('zzqqxxtermoinexistente')
    await page.getByTestId('semantic-search-submit-button').click()

    await expect(page.getByText(/Nenhum resultado encontrado/)).toBeVisible()
  })
})