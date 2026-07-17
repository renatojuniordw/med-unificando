import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function MedicineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const med = await prisma.medicine.findUnique({ where: { id: parseInt(id) } })
  if (!med) notFound()

  const prices = await prisma.price.findMany({
    where: { reference: med.reference },
    take: 20,
    orderBy: { pf0Price: 'asc' },
  })

  const fields = [
    { label: 'Referência', value: med.reference },
    { label: 'Princípio Ativo', value: med.activeIngredient },
    { label: 'Nome Comercial', value: med.tradeName },
    { label: 'Detentor', value: med.similarHolder },
    { label: 'Categoria', value: med.category },
    { label: 'Forma Farmacêutica', value: med.pharmaceuticalForm },
    { label: 'Concentração', value: med.concentration },
    { label: 'Código ATC', value: med.atcCode },
    { label: 'Tarja', value: med.prescriptionType },
    { label: 'Situação', value: med.status },
    { label: 'Autorização', value: med.authorization },
    { label: 'Apresentações', value: med.presentationCount?.toString() },
    { label: 'Data de Inclusão', value: med.inclusionDate },
    { label: 'Data ANVISA', value: med.anvisaFileDate?.toLocaleDateString('pt-BR') },
    { label: 'Última Importação', value: med.lastImportAt?.toLocaleString('pt-BR') },
  ]

  return (
    <section className="py-12 md:py-20 bg-neon-yellow min-h-screen border-b-8 border-brutalist-black">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <Link href="/" className="text-xs font-mono font-bold uppercase text-brutalist-black underline hover:bg-brutalist-black hover:text-neon-yellow px-2 py-1 transition-colors">
          ← VOLTAR PARA BUSCA
        </Link>

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
            {fields.filter(f => f.value).map(f => (
              <div key={f.label} className="border-b-2 border-brutalist-black pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{f.label}</span>
                <p className="font-bold uppercase mt-1">{f.value}</p>
              </div>
            ))}
          </div>
        </Card>

        {med.referenceMedicine && (
          <Card variant="active" className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2">MEDICAMENTO DE REFERÊNCIA</p>
            <p className="font-black uppercase text-lg">{med.referenceMedicine}</p>
          </Card>
        )}

        {prices.length > 0 && (
          <Card>
            <p className="text-[10px] font-black uppercase tracking-widest text-brutalist-black mb-4">PREÇOS CMED</p>
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
                      <td className="p-2">{p.pf0Price ? `R$ ${p.pf0Price.toFixed(2)}` : '-'}</td>
                      <td className="p-2">{p.pf18Price ? `R$ ${p.pf18Price.toFixed(2)}` : '-'}</td>
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
