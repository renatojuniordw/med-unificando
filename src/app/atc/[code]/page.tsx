import { getMedicinesByAtc } from '@/lib/actions/atc'
import { Badge } from '@/components/ui/badge'
import { StatusPill } from '@/components/ui/status-pill'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function AtcCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const decoded = decodeURIComponent(code).toUpperCase()
  const medicines = await getMedicinesByAtc(decoded)

  if (medicines.length === 0) notFound()

  const ativos = medicines.filter(m => m.status === 'Ativo').length
  const inativos = medicines.filter(m => m.status === 'Inativo').length

  return (
    <section className="py-12 md:py-20 bg-[var(--color-bg)]">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <Link href="/atc" className="text-sm text-muted hover:text-[var(--color-text)] underline transition-colors">
          ← Todos os códigos ATC
        </Link>

        <div className="mt-8 mb-10">
          <Badge variant="primary" className="mb-4">Código ATC</Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--color-text)]">
            {decoded}
          </h1>
          <p className="mt-2 text-base text-muted">
            {medicines.length} medicamentos | {ativos} ativos, {inativos} inativos
          </p>
        </div>

        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--color-bg-secondary)] border-b border-border">
                <th className="text-left p-3 text-xs font-semibold text-muted">Nome Comercial</th>
                <th className="text-left p-3 text-xs font-semibold text-muted">Princípio Ativo</th>
                <th className="text-left p-3 text-xs font-semibold text-muted">Detentor</th>
                <th className="text-left p-3 text-xs font-semibold text-muted">Categoria</th>
                <th className="text-center p-3 text-xs font-semibold text-muted">Situação</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med, i) => (
                <tr key={med.id} className={`border-b border-border ${i % 2 === 0 ? 'bg-[var(--color-bg)]' : 'bg-[var(--color-bg-secondary)]/50'} hover:bg-brand-yellow/5 transition-colors`}>
                  <td className="p-3 text-sm font-medium">
                    <Link href={`/medicamento/${med.id}`} className="text-[var(--color-text)] hover:underline">{med.tradeName}</Link>
                  </td>
                  <td className="p-3 text-sm text-[var(--color-text)]">{med.activeIngredient}</td>
                  <td className="p-3 text-sm text-muted">{med.similarHolder}</td>
                  <td className="p-3 text-sm text-[var(--color-text)]">{med.category}</td>
                  <td className="p-3 text-center text-sm font-medium">
                    {med.status ? <StatusPill status={med.status} /> : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
