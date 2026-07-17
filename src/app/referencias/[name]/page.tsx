import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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

        <div className="space-y-3">
          {medicines.map(med => (
            <Link
              key={med.id}
              href={`/medicamento/${med.id}`}
              className="block border-4 border-brutalist-black bg-white p-4 hover:bg-neon-yellow hover:-translate-y-1 hover:shadow-hard-lg transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <span className="font-black uppercase text-sm">{med.tradeName}</span>
                  <p className="text-xs font-mono font-bold text-slate-600 mt-1">{med.activeIngredient}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {med.category && <Badge variant="primary">{med.category}</Badge>}
                  {med.status === 'Ativo' && <span className="text-[10px] font-black uppercase text-success-green bg-white border-2 border-brutalist-black px-2 py-1">ATIVO</span>}
                  {med.status === 'Inativo' && <span className="text-[10px] font-black uppercase text-error-red bg-white border-2 border-brutalist-black px-2 py-1">INATIVO</span>}
                </div>
              </div>
              <div className="mt-2 text-[10px] font-mono text-slate-500">
                Ref: {med.reference} | {med.similarHolder}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
