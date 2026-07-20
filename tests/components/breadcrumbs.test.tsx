import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

describe('Breadcrumbs', () => {
  it('renders breadcrumb items', () => {
    render(<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders separator between items', () => {
    const { container } = render(<Breadcrumbs items={[{ label: 'A', href: '/a' }, { label: 'B' }]} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders single item', () => {
    render(<Breadcrumbs items={[{ label: 'Only' }]} />)
    expect(screen.getByText('Only')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Breadcrumbs items={[{ label: 'Item' }]} className="custom" />)
    expect(container.firstChild).toHaveClass('custom')
  })
})
