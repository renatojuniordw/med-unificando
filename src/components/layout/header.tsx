'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/lib/theme-provider'

const navLinks = [
  { href: '/buscar-avancado', label: 'Medicamentos' },
  { href: '/referencias', label: 'Referências' },
  { href: '/atc', label: 'ATC' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/admin/import', label: 'Admin' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggle } = useTheme()

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    if (!menuOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [menuOpen, closeMenu])

  return (
    <header className="bg-[var(--color-bg)] border-b border-[var(--color-border)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3" aria-label="Página inicial">
            <div className="bg-brand-yellow rounded-sm px-2 py-1">
              <span className="text-brand-black font-black tracking-tighter text-base">
                MED
              </span>
            </div>
            <span className="text-[var(--color-text)] font-black tracking-tighter text-lg hidden sm:block">
              UNIFICANDO
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Navegação principal">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-[var(--color-text-secondary)] px-3 py-2 rounded-sm hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="w-9 h-9 flex items-center justify-center rounded-sm border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors"
              aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>

            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center text-[var(--color-text)] border border-[var(--color-border)] rounded-sm hover:bg-[var(--color-bg-secondary)] transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen ? (
                  <path d="M6 6l12 12M18 6l-12 12" />
                ) : (
                  <>
                    <path d="M4 6h16" />
                    <path d="M4 12h16" />
                    <path d="M4 18h16" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            className="lg:hidden pb-4 border-t border-[var(--color-border)] pt-3"
            aria-label="Navegação mobile"
          >
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="block text-sm font-medium text-[var(--color-text-secondary)] py-2.5 px-2 rounded-sm hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                onClick={closeMenu}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
