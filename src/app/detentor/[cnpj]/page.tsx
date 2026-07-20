import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { StatusPill } from '@/components/ui/status-pill'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ cnpj: string }> }): Promise<Metadata> {
  const { cnpj } = await params
  const decoded = decodeURIComponent(cnpj)
  return {
    title: `${decoded} — Detentor de Registro`,
    description: `Medicamentos do detentor de registro ${decoded}. Consulte todos os medicamentos e similares.`,
    openGraph: {
      title: `${decoded} — Detentor de Registro | Med Unificando`,
      description: `Medicamentos do detentor de registro ${decoded}.`,
    },
  }
}

export default async function HolderPage({ params }: { params: Promise<{ cnpj: string }> }) {
  const { cnpj } = await params
  const decoded = decodeURIComponent(cnpj)

  const medicines = await prisma.medicine.findMany({
    where: {
      OR: [
        { similarHolder: { contains: decoded, mode: 'insensitive' } },
      ],
    },
    orderBy: { tradeName: 'asc' },
    take: 200,
  })

  if (medicines.length === 0) notFound()

  const holderName = medicines[0].similarHolder
  const ativos = medicines.filter(m => m.status === 'Ativo').length
  const categorias = [...new Set(medicines.map(m => m.category).filter(Boolean))]

  return (
    <section className="py-12 md:py-20 bg-[var(--color-bg)]">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <Breadcrumbs items={[
          { label: 'Medicamentos', href: '/' },
          { label: holderName },
        ]} />

        <div className="mb-10">
          <Badge variant="primary" className="mb-4">Detentor</Badge>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-[var(--color-text)]">
            {holderName}
          </h1>
          <p className="mt-2 text-base text-muted">
            {medicines.length} medicamentos | {ativos} ativos | {categorias.length} categorias
          </p>
        </div>

        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--color-bg-secondary)] border-b border-border">
                <th className="text-left p-3 text-xs font-semibold text-muted">Nome Comercial</th>
                <th className="text-left p-3 text-xs font-semibold text-muted">Princípio Ativo</th>
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
