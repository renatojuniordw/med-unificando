import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriceSection } from '@/components/medicines/price-section'

describe('PriceSection — preço 0 (Fase 4)', () => {
 ​it('mostra R$0.00 para preço zero (e não "-")', () => {
    const prices = [
      { id: 1, presentation: 'Comp', pf0Price: 0, pf18Price: 0, company: 'X' },
    ]
    render(<PriceSection prices={prices} />)
    expect(screen.getAllByText('R$0.00').length).toBeGreaterThanOrEqual(1)
    // E nenhum render de "-" para esse preço válido
    expect(screen.queryAllByText('-')).toHaveLength(0)
  })
})