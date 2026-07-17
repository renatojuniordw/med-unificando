import { getMedicinesByAtc } from '@/lib/actions/atc'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function AtcCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const decoded = decodeURIComponent(code).toUpperCase()
  const medicines = await getMedicinesByAtc(decoded)

  if (medicines.length === 0) notFound()

  const ativos = medicines.filter(m => m.status === 'Ativo').length
  const inativos = medicines.filter(m => m.status === 'Inativo').length

  return (
    <section className="py-12 md:py-20 bg-neon-yellow min-h-screen border-b-8 border-brutalist-black">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <Link href="/atc" className="text-xs font-mono font-bold uppercase text-brutalist-black underline hover:bg-brutalist-black hover:text-neon-yellow px-2 py-1 transition-colors">
          ← TODOS CÓDIGOS ATC
        </Link>

        <div className="mt-8 mb-10">
          <Badge variant="secondary" className="mb-4">CÓDIGO ATC</Badge>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-brutalist-black">
            {decoded}
          </h1>
          <p className="mt-4 text-sm font-mono font-bold uppercase text-brutalist-black">
            {medicines.length} medicamentos | {ativos} ativos, {inativos} inativos
          </p>
        </div>

        <div className="border-4 border-brutalist-black bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-brutalist-black text-neon-yellow">
                <th className="text-left p-3 font-black uppercase tracking-wider text-xs border-r-4 border-neon-yellow">Nome Comercial</th>
                <th className="text-left p-3 font-black uppercase tracking-wider text-xs border-r-4 border-neon-yellow">Princípio Ativo</th>
                <th className="text-left p-3 font-black uppercase tracking-wider text-xs border-r-4 border-neon-yellow">Detentor</th>
                <th className="text-left p-3 font-black uppercase tracking-wider text-xs border-r-4 border-neon-yellow">Categoria</th>
                <th className="text-center p-3 font-black uppercase tracking-wider text-xs">Situação</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med, i) => (
                <tr key={med.id} className={`border-t-2 border-brutalist-black ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-neon-yellow/20 transition-colors`}>
                  <td className="p-3 text-sm font-bold uppercase border-r-2 border-brutalist-black">
                    <Link href={`/medicamento/${med.id}`} className="hover:underline">{med.tradeName}</Link>
                  </td>
                  <td className="p-3 text-sm border-r-2 border-brutalist-black">{med.activeIngredient}</td>
                  <td className="p-3 text-xs font-mono border-r-2 border-brutalist-black">{med.similarHolder}</td>
                  <td className="p-3 text-xs font-bold uppercase border-r-2 border-brutalist-black">{med.category}</td>
                  <td className="p-3 text-center text-xs font-black uppercase">
                    {med.status === 'Ativo' ? <span className="text-success-green">ATIVO</span> : med.status === 'Inativo' ? <span className="text-error-red">INATIVO</span> : '-'}
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
