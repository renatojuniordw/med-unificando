'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { STORAGE_KEYS, THEME_COLORS } from '@/lib/constants'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggle: () => {},
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME) as Theme | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = stored === 'dark' || stored === 'light' ? stored : prefersDark ? 'dark' : 'light'
    setThemeState(initial)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(STORAGE_KEYS.THEME, theme)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? THEME_COLORS.DARK : THEME_COLORS.LIGHT)
  }, [theme, mounted])

  const toggle = useCallback(() => setThemeState(prev => prev === 'light' ? 'dark' : 'light'), [])
  const setTheme = useCallback((t: Theme) => setThemeState(t), [])

  // Valor memoizado: o objeto não muda de identidade a cada render do provider,
  // evitando re-render desnecessário de consumidores quando nada mudou.
  const value = useMemo(() => ({ theme, toggle, setTheme }), [theme, toggle, setTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
