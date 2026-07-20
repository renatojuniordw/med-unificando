import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { SimilarMedicinesList } from '@/components/medicines/similar-medicines-list'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { MedicineResult } from '@/types'

export default async function ReferenceDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const decodedName = decodeURIComponent(name)

  const medicines = await prisma.medicine.findMany({
    where: { referenceMedicine: { equals: decodedName, mode: 'insensitive' } },
    orderBy: { tradeName: 'asc' },
  })

  if (medicines.length === 0) notFound()

  return (
    <section className="py-12 md:py-20 bg-[var(--color-bg)]">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <Link href="/referencias" className="text-sm text-muted hover:text-[var(--color-text)] underline transition-colors">
          ← Todas as referências
        </Link>

        <div className="mt-8 mb-10">
          <Badge variant="primary" className="mb-4">Medicamento de Referência</Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--color-text)]">
            {decodedName}
          </h1>
          <p className="mt-2 text-base text-muted">
            {medicines.length} medicamento{medicines.length !== 1 ? 's' : ''} similar{medicines.length !== 1 ? 'es' : ''} intercambiável{medicines.length !== 1 ? 'is' : ''}
          </p>
        </div>

        <SimilarMedicinesList medicines={medicines as unknown as MedicineResult[]} />
      </div>
    </section>
  )
}
