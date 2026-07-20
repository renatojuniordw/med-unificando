import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '@/components/ui/card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Test content</Card>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('applies active variant by default', () => {
    render(<Card>Active</Card>)
    expect(screen.getByText('Active')).toHaveClass('shadow-card')
  })

  it('applies inactive variant', () => {
    render(<Card variant="inactive">Inactive</Card>)
    expect(screen.getByText('Inactive')).toHaveClass('border-dashed')
  })

  it('applies highlight variant', () => {
    render(<Card variant="highlight">Highlight</Card>)
    expect(screen.getByText('Highlight')).toHaveClass('border-l-4')
  })

  it('applies custom className', () => {
    render(<Card className="custom">Custom</Card>)
    expect(screen.getByText('Custom')).toHaveClass('custom')
  })
})
