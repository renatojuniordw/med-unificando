import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
  it('renders with text', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('applies red variant', () => {
    render(<Badge variant="red">Red</Badge>)
    expect(screen.getByText('Red')).toHaveClass('bg-error')
  })

  it('applies green variant', () => {
    render(<Badge variant="green">Green</Badge>)
    expect(screen.getByText('Green')).toHaveClass('bg-success')
  })

  it('applies yellow variant', () => {
    render(<Badge variant="yellow">Yellow</Badge>)
    expect(screen.getByText('Yellow')).toHaveClass('bg-warning')
  })

  it('applies blue variant', () => {
    render(<Badge variant="blue">Blue</Badge>)
    expect(screen.getByText('Blue')).toHaveClass('bg-info')
  })

  it('applies default variant', () => {
    render(<Badge>Default</Badge>)
    expect(screen.getByText('Default')).toHaveClass('bg-brand-black')
  })

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>)
    expect(screen.getByText('Custom')).toHaveClass('custom-class')
  })
})
