import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusPill } from '@/components/ui/status-pill'

describe('StatusPill', () => {
  it('renders "Ativo" with green style', () => {
    render(<StatusPill status="Ativo" />)
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toHaveClass('text-success-green')
  })

  it('renders "Inativo" with red style', () => {
    render(<StatusPill status="Inativo" />)
    expect(screen.getByText('Inativo')).toBeInTheDocument()
    expect(screen.getByText('Inativo')).toHaveClass('text-error-red')
  })

  it('renders dash for null status', () => {
    render(<StatusPill status={null} />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('renders dash for undefined status', () => {
    render(<StatusPill status={undefined} />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('renders dash for empty string status', () => {
    render(<StatusPill status="" />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })
})
