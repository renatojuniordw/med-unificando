import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Card } from '@/components/ui/card'
import { MedicineInfoCard } from '@/components/medicines/medicine-info-card'
import { ActionBar } from '@/components/medicines/action-bar'
import { PriceSection } from '@/components/medicines/price-section'
import { SimilarSection } from '@/components/medicines/similar-section'
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

  const fields = [
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

        <MedicineInfoCard fields={fields} />

        <ActionBar medicineId={med.id} />

        {med.referenceMedicine && (
          <Card variant="highlight" className="mb-8">
            <p className="text-xs font-semibold text-muted mb-1">MEDICAMENTO DE REFERÊNCIA</p>
            <p className="font-semibold text-lg text-[var(--color-text)]">{med.referenceMedicine}</p>
          </Card>
        )}

        <SimilarSection similares={similares} referenceMedicine={med.referenceMedicine ?? ''} />

        <PriceSection prices={prices} />
      </div>
    </section>
  )
}
