import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { ToastProvider, useToast } from '@/components/ui/toast'

function ToastTrigger() {
  const { toast } = useToast()
  return (
    <button type="button" onClick={() => toast('Salvo com sucesso', 'success')}>
      disparar
    </button>
  )
}

function renderWithToast() {
  return render(
    <ToastProvider>
      <ToastTrigger />
    </ToastProvider>
  )
}

describe('ToastProvider', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the message after trigger', () => {
    renderWithToast()
    fireEvent.click(screen.getByText('disparar'))

    expect(screen.getByText('Salvo com sucesso')).toBeInTheDocument()
  })

  it('announces toasts via role=status aria-live=polite (F9)', () => {
    const { container } = renderWithToast()
    fireEvent.click(screen.getByText('disparar'))

    const liveRegion = container.querySelector('[role="status"]')
    expect(liveRegion).not.toBeNull()
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
  })

  it('dismisses toast on click', () => {
    renderWithToast()
    fireEvent.click(screen.getByText('disparar'))

    const toast = screen.getByText('Salvo com sucesso')
    fireEvent.click(toast)

    expect(screen.queryByText('Salvo com sucesso')).not.toBeInTheDocument()
  })

  it('auto-dismisses toasts after 3 seconds', () => {
    vi.useFakeTimers()
    renderWithToast()

    fireEvent.click(screen.getByText('disparar'))

    expect(screen.getByText('Salvo com sucesso')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(3100)
    })

    expect(screen.queryByText('Salvo com sucesso')).not.toBeInTheDocument()
  })
})