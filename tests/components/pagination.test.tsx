import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PaginationBar } from '@/components/ui/pagination'

describe('PaginationBar', () => {
  const defaultProps = {
    page: 2,
    totalPages: 5,
    total: 100,
    pageSize: 20,
    onPageChange: vi.fn(),
    label: 'medicamento',
  }

  it('renders page info', () => {
    render(<PaginationBar {...defaultProps} />)
    expect(screen.getByText('2 / 5')).toBeInTheDocument()
    expect(screen.getByText(/100 medicamento/)).toBeInTheDocument()
  })

  it('calls onPageChange when clicking next', () => {
    render(<PaginationBar {...defaultProps} />)
    fireEvent.click(screen.getByText('Próxima'))
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(3)
  })

  it('calls onPageChange when clicking previous', () => {
    render(<PaginationBar {...defaultProps} />)
    fireEvent.click(screen.getByText('Anterior'))
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(1)
  })

  it('disables previous on first page', () => {
    render(<PaginationBar {...defaultProps} page={1} />)
    expect(screen.getByText('Anterior')).toBeDisabled()
  })

  it('disables next on last page', () => {
    render(<PaginationBar {...defaultProps} page={5} />)
    expect(screen.getByText('Próxima')).toBeDisabled()
  })

  it('renders page size selector when onPageSizeChange provided', () => {
    const onPageSizeChange = vi.fn()
    render(<PaginationBar {...defaultProps} onPageSizeChange={onPageSizeChange} />)
    expect(screen.getByText('10/pág')).toBeInTheDocument()
    expect(screen.getByText('25/pág')).toBeInTheDocument()
    expect(screen.getByText('50/pág')).toBeInTheDocument()
  })

  it('does not render page size selector when not provided', () => {
    render(<PaginationBar {...defaultProps} />)
    expect(screen.queryByText('10/pág')).not.toBeInTheDocument()
  })

  it('calls onPageSizeChange when selector changes', () => {
    const onPageSizeChange = vi.fn()
    render(<PaginationBar {...defaultProps} onPageSizeChange={onPageSizeChange} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '50' } })
    expect(onPageSizeChange).toHaveBeenCalledWith(50)
  })
})
