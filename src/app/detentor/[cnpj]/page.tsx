import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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
    <section className="py-12 md:py-20 bg-neon-yellow min-h-screen border-b-8 border-brutalist-black">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <Breadcrumbs items={[
          { label: 'Medicamentos', href: '/' },
          { label: holderName },
        ]} />

        <div className="mb-10">
          <Badge variant="secondary" className="mb-4">DETENTOR</Badge>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-brutalist-black">
            {holderName}
          </h1>
          <p className="mt-2 text-sm font-mono font-bold uppercase text-brutalist-black">
            {medicines.length} medicamentos | {ativos} ativos | {categorias.length} categorias
          </p>
        </div>

        <div className="border-4 border-brutalist-black bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-brutalist-black text-neon-yellow">
                <th className="text-left p-3 font-black uppercase text-xs border-r-4 border-neon-yellow">Nome Comercial</th>
                <th className="text-left p-3 font-black uppercase text-xs border-r-4 border-neon-yellow">Princípio Ativo</th>
                <th className="text-left p-3 font-black uppercase text-xs border-r-4 border-neon-yellow">Categoria</th>
                <th className="text-center p-3 font-black uppercase text-xs">Situação</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med, i) => (
                <tr key={med.id} className={`border-t-2 border-brutalist-black ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-neon-yellow/20 transition-colors`}>
                  <td className="p-3 text-sm font-bold uppercase border-r-2 border-brutalist-black">
                    <Link href={`/medicamento/${med.id}`} className="hover:underline">{med.tradeName}</Link>
                  </td>
                  <td className="p-3 text-sm border-r-2 border-brutalist-black">{med.activeIngredient}</td>
                  <td className="p-3 text-xs font-bold uppercase border-r-2 border-brutalist-black">{med.category}</td>
                  <td className="p-3 text-center text-xs font-black uppercase">
                    {med.status === 'Ativo'
                      ? <span className="text-success-green">ATIVO</span>
                      : <span className="text-error-red">INATIVO</span>}
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
