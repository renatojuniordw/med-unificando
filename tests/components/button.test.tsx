import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>)
    expect(screen.getByText('Primary')).toHaveClass('bg-brand-black')
  })

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByText('Secondary')).toHaveClass('border-2')
  })

  it('applies danger variant', () => {
    render(<Button variant="danger">Danger</Button>)
    expect(screen.getByText('Danger')).toHaveClass('bg-error')
  })

  it('applies ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const btn = screen.getByText('Ghost')
    expect(btn.className).toContain('hover:text-[var(--color-text)]')
  })

  it('applies small size', () => {
    render(<Button size="sm">Small</Button>)
    expect(screen.getByText('Small')).toHaveClass('text-xs')
  })

  it('applies large size', () => {
    render(<Button size="lg">Large</Button>)
    expect(screen.getByText('Large')).toHaveClass('text-base')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    expect(screen.getByText('Custom')).toHaveClass('custom-class')
  })
})
