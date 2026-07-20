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

vi.mock('@/hooks/use-favorites', () => ({
  useFavorites: () => ({
    isFavorite: () => false,
    toggle: vi.fn(),
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
  it('renders button', () => {
    const { container } = renderWithProviders(<ScrollToTop />)
    expect(container.querySelector('button')).toBeTruthy()
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
  it('renders button with copy icon', () => {
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
  })

  it('calls generateMedicinePdf on click', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:test')
    const revokeObjectURL = vi.fn()
    Object.assign(URL, { createObjectURL, revokeObjectURL })
    const clickFn = vi.fn()
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return { click: clickFn, href: '', download: '' } as unknown as HTMLAnchorElement
      return document.createElement(tag)
    })

    renderWithProviders(<PdfDownloadButton medicineId={1} />)
    fireEvent.click(screen.getByRole('button'))
    expect(clickFn).toHaveBeenCalled()
  })
})

describe('FavoriteButton', () => {
  it('renders favorite button', () => {
    renderWithProviders(<FavoriteButton medicineId={1} />)
    expect(screen.getByRole('button')).toBeTruthy()
    expect(screen.getByText('Favoritar')).toBeTruthy()
  })

  it('toggles favorite state', () => {
    renderWithProviders(<FavoriteButton medicineId={1} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Favoritado')).toBeTruthy()
  })
})

describe('ConsoleCredits', () => {
  it('renders credits component', () => {
    renderWithProviders(<ConsoleCredits />)
    expect(screen.getByText(/Créditos|credits|by|Renato/i)).toBeTruthy()
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
