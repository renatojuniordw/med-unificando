import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BarChart } from '@/components/ui/bar-chart'

describe('BarChart', () => {
  const items = [
    { name: 'Item A', count: 100 },
    { name: 'Item B', count: 50 },
    { name: 'Item C', count: 25 },
  ]

  it('renders all items', () => {
    render(<BarChart items={items} />)
    expect(screen.getByText('Item A')).toBeInTheDocument()
    expect(screen.getByText('Item B')).toBeInTheDocument()
    expect(screen.getByText('Item C')).toBeInTheDocument()
  })

  it('renders counts', () => {
    render(<BarChart items={items} />)
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    render(<BarChart items={items} label="Top Medicamentos" />)
    expect(screen.getByText('Top Medicamentos')).toBeInTheDocument()
  })

  it('does not render label when not provided', () => {
    render(<BarChart items={items} />)
    expect(screen.queryByText('Top Medicamentos')).not.toBeInTheDocument()
  })

  it('handles empty items array', () => {
    render(<BarChart items={[]} />)
    expect(screen.queryByText('Item A')).not.toBeInTheDocument()
  })

  it('applies custom bar color', () => {
    const { container } = render(<BarChart items={items} barColor="bg-red-500" />)
    const bars = container.querySelectorAll('.bg-red-500')
    expect(bars.length).toBeGreaterThan(0)
  })
})
