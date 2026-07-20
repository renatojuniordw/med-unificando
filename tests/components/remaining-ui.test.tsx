import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollToTop } from '@/components/ui/scroll-to-top'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { ClipboardButton } from '@/components/ui/clipboard-button'
import { PdfDownloadButton } from '@/components/ui/pdf-download-button'
import { FavoriteButton } from '@/components/ui/favorite-button'
import { ToastProvider, useToast } from '@/components/ui/toast'
import { ConsoleCredits } from '@/components/ui/console-credits'
import type { ReactNode } from 'react'

vi.mock('@/lib/actions/pdf-report', () => ({
  generateMedicinePdf: vi.fn().mockResolvedValue(new Array(100).fill(0)),
}))

const mockIsFavorite = vi.fn().mockReturnValue(false)
vi.mock('@/hooks/use-favorites', () => ({
  useFavorites: () => ({
    isFavorite: mockIsFavorite,
    toggle: vi.fn().mockImplementation(() => {
      mockIsFavorite.mockReturnValue(!mockIsFavorite())
    }),
  }),
}))

function Wrapper({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}

function renderWithProviders(ui: ReactNode) {
  return render(<Wrapper>{ui}</Wrapper>)
}

describe('Skeleton', () => {
  it('renders with animate-pulse', () => {
    const { container } = renderWithProviders(<Skeleton />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })
})

describe('ScrollToTop', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<ScrollToTop />)
    expect(container).toBeTruthy()
  })
})

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    renderWithProviders(
      <ErrorBoundary fallback={<div>Error!</div>}>
        <div>Test content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Test content')).toBeTruthy()
  })

  it('renders fallback when error occurs', () => {
    const ThrowingComponent = () => {
      throw new Error('test error')
    }
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderWithProviders(
      <ErrorBoundary fallback={<div>Custom error</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Custom error')).toBeTruthy()
    consoleSpy.mockRestore()
  })
})

describe('ClipboardButton', () => {
  it('renders button', () => {
    renderWithProviders(<ClipboardButton text="test" />)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('calls clipboard on click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    renderWithProviders(<ClipboardButton text="test" />)
    fireEvent.click(screen.getByRole('button'))
    expect(writeText).toHaveBeenCalledWith('test')
  })
})

describe('PdfDownloadButton', () => {
  it('renders download button', () => {
    renderWithProviders(<PdfDownloadButton medicineId={1} />)
    expect(screen.getByRole('button')).toBeTruthy()
    expect(screen.getByText('Baixar PDF')).toBeTruthy()
  })
})

describe('FavoriteButton', () => {
  it('renders favorite button', () => {
    renderWithProviders(<FavoriteButton medicineId={1} />)
    expect(screen.getByRole('button')).toBeTruthy()
    expect(screen.getByText('Favoritar')).toBeTruthy()
  })

  it('shows Favoritado when clicked', () => {
    vi.mocked(vi.importActual('@/hooks/use-favorites')).catch(() => {})
    renderWithProviders(<FavoriteButton medicineId={1} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Favoritado')).toBeTruthy()
  })
})

describe('ConsoleCredits', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<ConsoleCredits />)
    expect(container).toBeTruthy()
  })
})

describe('ToastProvider', () => {
  it('renders children', () => {
    renderWithProviders(<div>Child content</div>)
    expect(screen.getByText('Child content')).toBeTruthy()
  })

  it('shows toast when triggered', () => {
    function TriggerToast() {
      const { toast } = useToast()
      return <button onClick={() => toast('Test toast')}>Trigger</button>
    }
    renderWithProviders(<TriggerToast />)
    fireEvent.click(screen.getByText('Trigger'))
    expect(screen.getByText('Test toast')).toBeTruthy()
  })
})
