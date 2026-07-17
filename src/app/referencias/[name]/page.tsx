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
    <section className="py-12 md:py-20 bg-neon-yellow min-h-screen border-b-8 border-brutalist-black">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <Link href="/referencias" className="text-xs font-mono font-bold uppercase text-brutalist-black underline hover:bg-brutalist-black hover:text-neon-yellow px-2 py-1 transition-colors">
          ← TODAS REFERÊNCIAS
        </Link>

        <div className="mt-8 mb-10">
          <Badge variant="secondary" className="mb-4">MEDICAMENTO DE REFERÊNCIA</Badge>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-brutalist-black">
            {decodedName}
          </h1>
          <p className="mt-4 text-sm font-mono font-bold uppercase text-brutalist-black">
            {medicines.length} medicamento{medicines.length !== 1 ? 's' : ''} similar{medicines.length !== 1 ? 'es' : ''} intercambiável{medicines.length !== 1 ? 'is' : ''}
          </p>
        </div>

        <SimilarMedicinesList medicines={medicines as unknown as MedicineResult[]} />
      </div>
    </section>
  )
}
