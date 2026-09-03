import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ViewToggle } from '@/components/medicines/view-toggle'
import { PaginationBar } from '@/components/ui/pagination'

describe('Acessibilidade (Fase 5)', () => {
  it('ViewToggle expõe aria-pressed no botão ativo', () => {
    render(<ViewToggle view="cards" onChange={vi.fn()} />)
    const cards = screen.getByRole('button', { name: 'Cards' })
    const table = screen.getByRole('button', { name: 'Tabela' })
    expect(cards).toHaveAttribute('aria-pressed', 'true')
    expect(table).toHaveAttribute('aria-pressed', 'false')
  })

  it('PaginationBar tem nome acessível no select de itens por página', () => {
    render(
      <PaginationBar
        page={1}
        totalPages={3}
        total={30}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Itens por página')).toBeInTheDocument()
  })
})