'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useTheme } from '@/lib/theme'

const navLinks = [
  { href: '/', label: 'MEDICAMENTOS' },
  { href: '/referencias', label: 'REFERÊNCIAS' },
  { href: '/atc', label: 'ATC' },
  { href: '/dashboard', label: 'DASHBOARD' },
  { href: '/admin/import', label: 'ADMIN' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggle } = useTheme()

  return (
    <header className="bg-brutalist-black border-b-4 border-neon-yellow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-neon-yellow p-2 border-2 border-brutalist-black shadow-hard-white hover:-translate-y-1 hover:shadow-[6px_6px_0px_#fff] transition-all">
              <span className="text-brutalist-black font-black uppercase tracking-tighter text-lg">
                U
              </span>
            </div>
            <span className="text-white font-black uppercase tracking-tighter text-xl hidden sm:block">
              UNIFICANDO
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs font-black uppercase tracking-widest text-white px-4 py-2 hover:bg-neon-yellow hover:text-brutalist-black transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={toggle}
              className="ml-2 w-10 h-10 border-2 border-neon-yellow text-neon-yellow font-black text-lg hover:bg-neon-yellow hover:text-brutalist-black transition-colors"
              aria-label="Alternar tema"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </nav>

          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={toggle}
              className="w-10 h-10 border-2 border-neon-yellow text-neon-yellow font-black text-lg"
              aria-label="Alternar tema"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button
              className="w-10 h-10 border-2 border-neon-yellow flex items-center justify-center text-neon-yellow"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                {menuOpen ? (
                  <path strokeLinecap="square" d="M6 6l12 12M18 6l-12 12" />
                ) : (
                  <>
                    <path strokeLinecap="square" d="M4 6h16" />
                    <path strokeLinecap="square" d="M4 12h16" />
                    <path strokeLinecap="square" d="M4 18h16" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="lg:hidden pb-6 border-t-4 border-neon-yellow pt-4">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="block text-sm font-black uppercase tracking-widest text-white py-3 px-2 hover:bg-neon-yellow hover:text-brutalist-black"
                onClick={() => setMenuOpen(false)}
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
