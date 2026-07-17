import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { ClipboardButton } from '@/components/ui/clipboard-button'
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

  const bulaUrl = `https://consultas.anvisa.gov.br/#/medicamento/${med.reference}/`

  return (
    <section className="py-12 md:py-20 bg-neon-yellow min-h-screen border-b-8 border-brutalist-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <Breadcrumbs items={[
          { label: 'Medicamentos', href: '/' },
          { label: med.tradeName },
        ]} />

        <div className="mt-8 mb-10">
          <Badge variant="secondary" className="mb-4">
            {med.category || 'MEDICAMENTO'}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-brutalist-black">
            {med.tradeName}
          </h1>
          <p className="mt-2 text-sm font-mono font-bold uppercase text-brutalist-black">
            {med.activeIngredient}
          </p>
        </div>

        <Card className="mb-8">
          <div className="grid md:grid-cols-2 gap-4">
              {fields.filter(f => f.value !== null && f.value !== '').map(f => (
                <div key={f.label} className="border-b-2 border-brutalist-black pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{f.label}</span>
                  <div className="font-bold uppercase mt-1 flex items-center gap-2">
                    {f.link ? (
                      <Link href={f.link} className="hover:underline">{f.value ?? ''}</Link>
                    ) : f.value}
                    {f.label === 'Referência' && <ClipboardButton text={f.value ?? ''} />}
                  </div>
                </div>
              ))}
          </div>
        </Card>

        <div className="flex gap-3 mb-8 flex-wrap">
          <a
            href={bulaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border-4 border-brutalist-black bg-white px-6 py-3 font-black uppercase text-xs tracking-widest hover:bg-neon-yellow transition-colors"
          >
            📄 BULA ELETRÔNICA
          </a>
        </div>

        {med.referenceMedicine && (
          <Card variant="active" className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2">MEDICAMENTO DE REFERÊNCIA</p>
            <p className="font-black uppercase text-lg">{med.referenceMedicine}</p>
          </Card>
        )}

        {similares.length > 0 && (
          <Card className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-brutalist-black mb-4">
              SIMILARES DE {med.referenceMedicine}
            </p>
            <div className="space-y-2">
              {similares.map(s => (
                <Link
                  key={s.id}
                  href={`/medicamento/${s.id}`}
                  className="block border-2 border-brutalist-black p-3 hover:bg-neon-yellow transition-colors"
                >
                  <span className="font-black uppercase text-sm">{s.tradeName}</span>
                  <span className="ml-2 text-[10px] font-mono text-slate-500">{s.similarHolder}</span>
                  <span className={`ml-2 text-[10px] font-black uppercase ${s.status === 'Ativo' ? 'text-success-green' : 'text-error-red'}`}>
                    {s.status}
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {prices.length > 0 && (
          <Card>
            <p className="text-[10px] font-black uppercase tracking-widest text-brutalist-black mb-4">PREÇOS CMED</p>

            {(() => {
              const maxPrice = Math.max(...prices.map(p => p.pf0Price ?? p.pf18Price ?? 0))
              return (
                <div className="mb-6 space-y-2">
                  {prices.slice(0, 5).map(p => {
                    const val = p.pf0Price ?? 0
                    const width = maxPrice > 0 ? (val / maxPrice) * 100 : 0
                    return (
                      <div key={p.id} className="flex items-center gap-3 text-[10px]">
                        <span className="w-2/5 truncate font-bold">{p.presentation}</span>
                        <div className="flex-1 h-4 border-2 border-brutalist-black bg-white">
                          <div className="h-full bg-brutalist-black" style={{ width: `${width}%` }} />
                        </div>
                        <span className="w-16 text-right font-black">R${val.toFixed(2)}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
            <div className="overflow-x-auto border-2 border-brutalist-black">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-brutalist-black text-neon-yellow">
                    <th className="text-left p-2 font-black uppercase">Apresentação</th>
                    <th className="text-left p-2 font-black uppercase">PF0</th>
                    <th className="text-left p-2 font-black uppercase">PF18</th>
                    <th className="text-left p-2 font-black uppercase">Empresa</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map(p => (
                    <tr key={p.id} className="border-t-2 border-brutalist-black">
                      <td className="p-2 font-bold">{p.presentation}</td>
                      <td className="p-2">{p.pf0Price ? `R$${p.pf0Price.toFixed(2)}` : '-'}</td>
                      <td className="p-2">{p.pf18Price ? `R$${p.pf18Price.toFixed(2)}` : '-'}</td>
                      <td className="p-2">{p.company}</td>
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
