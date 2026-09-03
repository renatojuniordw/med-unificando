import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { useEffect } from 'react'
import { ThemeProvider, useTheme } from '@/lib/theme-provider'
import { STORAGE_KEYS } from '@/lib/constants'

function ThemeConsumer() {
  const { theme, toggle, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={toggle}>toggle</button>
      <button onClick={() => setTheme('dark')}>set-dark</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.classList.remove('dark')
  })

  it('exposes theme with toggle via useTheme', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    )

    const value = screen.getByTestId('theme-value')
    expect(value.textContent).toBe('light')

    fireEvent.click(screen.getByText('toggle'))
    expect(value.textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    fireEvent.click(screen.getByText('toggle'))
    expect(value.textContent).toBe('light')
  })

  it('persists theme choice to localStorage', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByText('set-dark'))
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe('dark')
  })

  it('keeps context value identity stable between renders without changes', () => {
    // A memoização do value (F3) garante que o objeto retornado por useTheme é o
    // mesmo quando nada muda. Capturamos a referência via efeito (pós-render) —
    // com value não memoizado, o efeito re-executaria a cada re-render do provider.
    const captured: unknown[] = []

    function Capture() {
      const value = useTheme()
      useEffect(() => {
        captured.push(value)
      }, [value])
      return null
    }

    const { rerender } = render(
      <ThemeProvider>
        <Capture />
      </ThemeProvider>
    )

    act(() => {
      rerender(
        <ThemeProvider>
          <Capture />
        </ThemeProvider>
      )
    })

    expect(captured).toHaveLength(1)
  })
})