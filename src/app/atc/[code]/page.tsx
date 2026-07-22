import { getMedicinesByAtc } from '@/lib/actions/atc'
import { AtcCodeContent } from '@/components/medicines/atc-code-content'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const decoded = decodeURIComponent(code).toUpperCase()
  return {
    title: `ATC ${decoded}`,
    description: `Medicamentos com classificação ATC ${decoded}. Veja todos os medicamentos deste código.`,
    openGraph: {
      title: `ATC ${decoded} — Med Unificando`,
      description: `Medicamentos com classificação ATC ${decoded}.`,
    },
  }
}

export default async function AtcCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const decoded = decodeURIComponent(code).toUpperCase()
  const initialData = await getMedicinesByAtc(decoded, 1, 20)

  if (initialData.data.length === 0) notFound()

  return <AtcCodeContent code={decoded} initialData={initialData} />
}
