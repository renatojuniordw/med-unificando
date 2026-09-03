import { getCachedMedicineDetail } from '@/lib/data-cache'
import { safeJsonLd } from '@/lib/safe-json-ld'
import { medicineUrl, parseMedicineSlug } from '@/lib/medicine-url'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Card } from '@/components/ui/card'
import { MedicineInfoCard } from '@/components/medicines/medicine-info-card'
import { ActionBar } from '@/components/medicines/action-bar'
import { PriceSection } from '@/components/medicines/price-section'
import { SimilarSection } from '@/components/medicines/similar-section'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const id = parseMedicineSlug(slug)
  // Reusa o mesmo cache de 1h do corpo da página (evita query duplicada no DB).
  const detail = id === null ? null : await getCachedMedicineDetail(id)
  const med = detail?.medicine
  if (!med) return { title: 'Medicamento não encontrado' }

  const canonical = medicineUrl(med.id, med.tradeName)
  const full = `${med.tradeName} — ${med.activeIngredient} | Med Unificando`
  const title = full.length > 60 ? `${med.tradeName} | Med Unificando` : full
  const description = `${med.tradeName} (${med.activeIngredient}) — ${med.category || 'Medicamento'} ${med.status === 'Ativo' ? 'com registro ativo' : 'com registro inativo'} na ANVISA. ${med.similarHolder}.`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${med.tradeName} — ${med.activeIngredient}`,
      description,
      type: 'article',
      siteName: 'Med Unificando',
      locale: 'pt_BR',
      url: canonical,
    },
  }
}

export default async function MedicineDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const id = parseMedicineSlug(slug)
  const detail = id === null ? null : await getCachedMedicineDetail(id)
  if (!detail) notFound()

  const { medicine: med, prices, similares } = detail

  // URLs legadas /medicamento/{id} → redirect permanente para o slug canônico.
  if (/^\d+$/.test(slug)) redirect(medicineUrl(med.id, med.tradeName))

  const canonical = medicineUrl(med.id, med.tradeName)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalDrug',
    name: med.tradeName,
    description: `${med.activeIngredient} — ${med.category || 'Medicamento'}`,
    activeIngredient: med.activeIngredient,
    manufacturer: med.similarHolder,
    url: canonical,
    code: {
      '@type': 'MedicalCode',
      code: med.reference,
      codingSystem: 'ANVISA',
    },
    drugClass: med.atcCode ? { '@type': 'MedicalCode', code: med.atcCode, codingSystem: 'ATC' } : undefined,
    status: med.status === 'Ativo' ? 'available' : 'discontinued',
    datePublished: med.anvisaFileDate ? new Date(med.anvisaFileDate).toISOString().split('T')[0] : undefined,
    dateModified: med.lastImportAt ? new Date(med.lastImportAt).toISOString().split('T')[0] : undefined,
  }

  const fields = [
    { label: 'Referência', value: med.reference },
    { label: 'Princípio Ativo', value: med.activeIngredient },
    { label: 'Nome Comercial', value: med.tradeName },
    { label: 'Detentor', value: med.similarHolder, link: `/detentor/${encodeURIComponent(med.similarHolder)}` },
    { label: 'Categoria', value: med.category },
    { label: 'Forma Farmacêutica', value: med.pharmaceuticalForm },
    { label: 'Concentração', value: med.concentration },
    { label: 'Código ATC', value: med.atcCode, link: med.atcCode ? `/atc/${med.atcCode}` : undefined },
    { label: 'Tarja', value: med.prescriptionType },
    { label: 'Situação', value: med.status },
    { label: 'Autorização', value: med.authorization },
    { label: 'Apresentações', value: med.presentationCount?.toString() ?? null },
    { label: 'Data de Inclusão', value: med.inclusionDate },
    { label: 'Sinônimos', value: med.synonyms },
    { label: 'Indicações', value: med.indications },
    { label: 'Data ANVISA', value: med.anvisaFileDate ? new Date(med.anvisaFileDate).toLocaleDateString('pt-BR') : null },
    { label: 'Última Importação', value: med.lastImportAt ? new Date(med.lastImportAt).toLocaleString('pt-BR') : null },
  ]

  return (
    <section className="py-12 md:py-20 bg-[var(--color-bg)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <Breadcrumbs items={[
          { label: 'Medicamentos', href: '/buscar-avancado' },
          { label: med.tradeName },
        ]} />

        <div className="mt-8 mb-10">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <Badge variant="primary">
              {med.category || 'MEDICAMENTO'}
            </Badge>
            {med.farmaciaPopular && (
              <Badge variant="success" className="text-xs font-bold tracking-wide">
                ✅ FARMÁCIA POPULAR
              </Badge>
            )}
          </div>
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
            <p className="font-semibold text-lg text-[var(--color-text)]">
              <Link
                href={`/referencias/${encodeURIComponent(med.referenceMedicine)}`}
                className="hover:underline"
              >
                {med.referenceMedicine}
              </Link>
            </p>
          </Card>
        )}

        <SimilarSection similares={similares} referenceMedicine={med.referenceMedicine ?? ''} currentMedicineId={med.id} />

        <PriceSection prices={prices} />
      </div>
    </section>
  )
}