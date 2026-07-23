import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página não encontrada',
}

export default function NotFoundPage() {
  return (
    <section className="py-20 md:py-32 bg-[var(--color-bg)]">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <Badge variant="primary" className="mb-6">404</Badge>
        <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-[var(--color-text)]">
          Página não<br />encontrada
        </h1>
        <p className="mt-4 text-base text-muted max-w-md mx-auto">
          A página que você procura não existe ou foi movida.
          Verifique o endereço ou volte para o início.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-brand-black text-white font-semibold rounded-sm px-6 min-h-[44px] text-sm transition-colors hover:bg-primary-light"
          >
            Página Inicial
          </Link>
          <Link
            href="/buscar-avancado"
            className="inline-flex items-center justify-center border border-border text-[var(--color-text)] font-semibold rounded-sm px-6 min-h-[44px] text-sm transition-colors hover:bg-[var(--color-bg-secondary)]"
          >
            Buscar Medicamentos
          </Link>
        </div>
      </div>
    </section>
  )
}
