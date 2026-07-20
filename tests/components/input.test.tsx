import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter email" />)
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument()
  })

  it('handles value changes', () => {
    const onChange = vi.fn()
    render(<Input value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('can be disabled', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('renders as password type', () => {
    render(<Input type="password" label="Password" />)
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })

  it('applies custom className', () => {
    render(<Input className="custom" />)
    expect(screen.getByRole('textbox')).toHaveClass('custom')
  })
})
