import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { ClipboardButton } from '@/components/ui/clipboard-button'
import { PdfDownloadButton } from '@/components/ui/pdf-download-button'
import { StatusPill } from '@/components/ui/status-pill'
import { FavoriteButton } from '@/components/ui/favorite-button'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const med = await prisma.medicine.findUnique({ where: { id: parseInt(id) } })
  if (!med) return { title: 'Medicamento não encontrado' }

  const title = `${med.tradeName} — ${med.activeIngredient} | Unificando Med`
  const description = `${med.tradeName} (${med.activeIngredient}) — ${med.category || 'Medicamento'} ${med.status === 'Ativo' ? 'com registro ativo' : 'com registro inativo'} na ANVISA. ${med.similarHolder}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'Unificando Med',
      locale: 'pt_BR',
    },
  }
}

export default async function MedicineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const med = await prisma.medicine.findUnique({ where: { id: parseInt(id) } })
  if (!med) notFound()

  const prices = await prisma.price.findMany({
    where: { reference: med.reference },
    take: 20,
    orderBy: { pf0Price: 'asc' },
  })

  const similares = med.referenceMedicine
    ? await prisma.medicine.findMany({
        where: { referenceMedicine: med.referenceMedicine, id: { not: med.id } },
        take: 10,
        orderBy: { tradeName: 'asc' },
      })
    : []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalDrug',
    name: med.tradeName,
    description: `${med.activeIngredient} — ${med.category || 'Medicamento'}`,
    activeIngredient: med.activeIngredient,
    manufacturer: med.similarHolder,
    code: {
      '@type': 'MedicalCode',
      code: med.reference,
      codingSystem: 'ANVISA',
    },
    drugClass: med.atcCode ? { '@type': 'MedicalCode', code: med.atcCode, codingSystem: 'ATC' } : undefined,
    status: med.status === 'Ativo' ? 'available' : 'discontinued',
  }

  const fields: { label: string; value: string | null; link?: string }[] = [
    { label: 'Referência', value: med.reference },
    { label: 'Princípio Ativo', value: med.activeIngredient },
    { label: 'Nome Comercial', value: med.tradeName },
    { label: 'Detentor', value: med.similarHolder, link: `/detentor/${encodeURIComponent(med.similarHolder)}` },
    { label: 'Categoria', value: med.category },
    { label: 'Forma Farmacêutica', value: med.pharmaceuticalForm },
    { label: 'Concentração', value: med.concentration },
    { label: 'Código ATC', value: med.atcCode },
    { label: 'Tarja', value: med.prescriptionType },
    { label: 'Situação', value: med.status },
    { label: 'Autorização', value: med.authorization },
    { label: 'Apresentações', value: med.presentationCount?.toString() ?? null },
    { label: 'Data de Inclusão', value: med.inclusionDate },
    { label: 'Sinônimos', value: med.synonyms },
    { label: 'Indicações', value: med.indications },
    { label: 'Data ANVISA', value: med.anvisaFileDate?.toLocaleDateString('pt-BR') ?? null },
    { label: 'Última Importação', value: med.lastImportAt?.toLocaleString('pt-BR') ?? null },
  ]

  const bulaSearchUrl = 'https://consultas.anvisa.gov.br/#/medicamento/'

  return (
    <section className="py-12 md:py-20 bg-[var(--color-bg)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <Breadcrumbs items={[
          { label: 'Medicamentos', href: '/buscar-avancado' },
          { label: med.tradeName },
        ]} />

        <div className="mt-8 mb-10">
          <Badge variant="primary" className="mb-4">
            {med.category || 'MEDICAMENTO'}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--color-text)]">
            {med.tradeName}
          </h1>
          <p className="mt-2 text-base text-muted">
            {med.activeIngredient}
          </p>
        </div>

        <Card className="mb-8">
          <div className="grid md:grid-cols-2 gap-4">
              {fields.filter(f => f.value !== null && f.value !== '').map(f => (
                <div key={f.label} className="border-b border-border pb-2">
                  <span className="text-xs font-semibold text-muted">{f.label}</span>
                  <div className="font-medium text-[var(--color-text)] mt-0.5 flex items-center gap-2">
                    {f.link ? (
                      <Link href={f.link} className="hover:underline">{f.value ?? ''}</Link>
                    ) : f.label === 'Situação' ? (
                      <span className={`inline-flex items-center gap-1.5 ${f.value === 'Ativo' ? 'text-success' : 'text-error'}`}>
                        <span className={`w-2 h-2 rounded-full inline-block ${f.value === 'Ativo' ? 'bg-success' : 'bg-error'}`} />
                        {f.value}
                      </span>
                    ) : f.value}
                    {f.label === 'Referência' && <ClipboardButton text={f.value ?? ''} />}
                  </div>
                </div>
              ))}
          </div>
        </Card>

        <div className="flex gap-3 mb-8 flex-wrap items-center">
          <a
            href={bulaSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-border rounded-sm bg-[var(--color-bg)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            Consultar na ANVISA
          </a>
          <PdfDownloadButton medicineId={med.id} />
          <FavoriteButton medicineId={med.id} />
        </div>

        {med.referenceMedicine && (
          <Card variant="highlight" className="mb-8">
            <p className="text-xs font-semibold text-muted mb-1">MEDICAMENTO DE REFERÊNCIA</p>
            <p className="font-semibold text-lg text-[var(--color-text)]">{med.referenceMedicine}</p>
          </Card>
        )}

        {similares.length > 0 && (
          <Card className="mb-8">
            <p className="text-xs font-semibold text-muted mb-4">
              Similares de {med.referenceMedicine}
            </p>
            <div className="space-y-2">
              {similares.map(s => (
                <Link
                  key={s.id}
                  href={`/medicamento/${s.id}`}
                  className="block border border-border rounded-sm p-3 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-sm text-[var(--color-text)]">{s.tradeName}</span>
                    <span className="text-xs text-muted">{s.similarHolder}</span>
                    <StatusPill status={s.status} />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {prices.length > 0 && (
          <Card>
            <p className="text-xs font-semibold text-muted mb-4">Preços CMED</p>

            {(() => {
              const maxPrice = Math.max(...prices.map(p => p.pf0Price ?? p.pf18Price ?? 0))
              return (
                <div className="mb-6 space-y-2">
                  {prices.slice(0, 5).map(p => {
                    const val = p.pf0Price ?? 0
                    const width = maxPrice > 0 ? (val / maxPrice) * 100 : 0
                    return (
                      <div key={p.id} className="flex items-center gap-3 text-xs">
                        <span className="w-2/5 truncate font-medium text-[var(--color-text)]">{p.presentation}</span>
                        <div className="flex-1 h-3 bg-[var(--color-bg-secondary)] rounded-sm overflow-hidden">
                          <div className="h-full bg-brand-black rounded-sm" style={{ width: `${width}%` }} />
                        </div>
                        <span className="w-16 text-right font-semibold">R${val.toFixed(2)}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
            <div className="overflow-x-auto border border-border rounded-sm">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[var(--color-bg-secondary)]">
                    <th className="text-left p-2.5 font-semibold text-muted">Apresentação</th>
                    <th className="text-left p-2.5 font-semibold text-muted">PF0</th>
                    <th className="text-left p-2.5 font-semibold text-muted">PF18</th>
                    <th className="text-left p-2.5 font-semibold text-muted">Empresa</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map(p => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="p-2.5 font-medium">{p.presentation}</td>
                      <td className="p-2.5">{p.pf0Price ? `R$${p.pf0Price.toFixed(2)}` : '-'}</td>
                      <td className="p-2.5">{p.pf18Price ? `R$${p.pf18Price.toFixed(2)}` : '-'}</td>
                      <td className="p-2.5">{p.company}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </section>
  )
}
