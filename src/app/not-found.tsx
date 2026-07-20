import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default function NotFound() {
  return (
    <section className="py-24 md:py-32 flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 text-center">
        <Badge variant="primary" className="mb-6">
          404
        </Badge>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[var(--color-text)] leading-[0.9]">
          Página não
          <br />
          encontrada
        </h1>
        <p className="mt-4 text-base text-[var(--color-text-secondary)]">
          A página que você procura não existe ou foi removida.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-block bg-brand-black text-white px-6 py-3 text-sm font-semibold rounded-sm hover:bg-primary-light transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </section>
  )
}
