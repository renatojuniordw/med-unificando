import Link from 'next/link'
import { SemanticSearch } from '@/components/medicines/semantic-search'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  return (
    <section className="py-16 md:py-28 bg-neon-yellow min-h-screen border-b-8 border-brutalist-black">
      <div className="max-w-3xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-6">
            LISTA ANVISA
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-brutalist-black">
            Medicamentos
            <br />
            Intercambiáveis
          </h1>
          <p className="mt-6 text-sm font-mono font-bold uppercase text-brutalist-black max-w-2xl mx-auto">
            Consulte medicamentos similares e seus respectivos medicamentos de
            referência conforme dados abertos ANVISA
          </p>
        </div>

        <SemanticSearch />

        <p className="mt-6 text-center">
          <Link
            href="/buscar-avancado"
            className="text-xs font-mono font-bold uppercase text-brutalist-black underline hover:text-slate-600 transition-colors"
          >
            Busca avançada e listagem completa →
          </Link>
        </p>
      </div>
    </section>
  )
}
