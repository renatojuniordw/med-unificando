import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

vi.mock('@/lib/config', () => ({
  SITE: { BASE_URL: 'http://localhost:3000' },
}))

describe('Breadcrumbs', () => {
  it('renders items with home link', () => {
    render(<Breadcrumbs items={[{ label: 'Dashboard' }]} />)
    const homeLinks = screen.getAllByText('Home')
    expect(homeLinks.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders link items with href', () => {
    render(<Breadcrumbs items={[{ label: 'Section', href: '/section' }]} />)
    expect(screen.getByText('Section')).toBeInTheDocument()
  })
})
