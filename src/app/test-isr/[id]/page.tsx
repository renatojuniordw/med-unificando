import { prisma } from '@/lib/prisma'

export const revalidate = 3600

export default async function TestIsrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const med = await prisma.medicine.findUnique({ where: { id: parseInt(id) } })
  return <div>test-isr {id} {med?.tradeName ?? 'nada'}</div>
}