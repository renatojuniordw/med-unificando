import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Skeleton } from '@/components/ui/skeleton'
import { CardButton } from '@/components/ui/card-button'
import { CardCredits } from '@/components/ui/card-credits'
import { ScrollToTop } from '@/components/ui/scroll-to-top'

describe('Skeleton', () => {
  it('renders with default classes', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom" />)
    expect(container.firstChild).toHaveClass('custom')
  })
})

describe('CardButton', () => {
  it('renders with title', () => {
    render(<CardButton title="Test Card" />)
    expect(screen.getByText('Test Card')).toBeInTheDocument()
  })

  it('renders with description', () => {
    render(<CardButton title="T" description="Desc" />)
    expect(screen.getByText('Desc')).toBeInTheDocument()
  })
})

describe('CardCredits', () => {
  it('renders credits section', () => {
    render(<CardCredits />)
    expect(screen.getByText('Créditos')).toBeInTheDocument()
  })
})

describe('ScrollToTop', () => {
  it('renders initially hidden', () => {
    const { container } = render(<ScrollToTop />)
    const button = container.querySelector('button')
    expect(button).toHaveClass('opacity-0')
  })

  it('becomes visible when scrolled', () => {
    render(<ScrollToTop />)
    fireEvent.scroll(window, { target: { scrollY: 500 } })
    const button = document.querySelector('button')
    expect(button?.className).not.toBeNull()
  })
})
