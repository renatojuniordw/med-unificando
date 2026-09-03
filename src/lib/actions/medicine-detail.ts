'use server'

import { prisma } from '@/lib/prisma'
import { MEDICINE_LIMITS } from '@/lib/constants'

export interface MedicineDetail {
  medicine: NonNullable<Awaited<ReturnType<typeof prisma.medicine.findUnique>>>
  prices: Awaited<ReturnType<typeof prisma.price.findMany>>
  similares: Awaited<ReturnType<typeof prisma.medicine.findMany>>
}

export async function getMedicineDetail(id: number): Promise<MedicineDetail | null> {
  const medicine = await prisma.medicine.findUnique({ where: { id } })
  if (!medicine) return null

  const [prices, similares] = await Promise.all([
    prisma.price.findMany({
      where: { reference: medicine.reference },
      take: MEDICINE_LIMITS.MAX_PRICES,
      orderBy: { pf0Price: 'asc' },
    }),
    medicine.referenceMedicine
      ? prisma.medicine.findMany({
          where: { referenceMedicine: medicine.referenceMedicine, id: { not: medicine.id } },
          take: MEDICINE_LIMITS.MAX_SIMILARES,
          orderBy: { tradeName: 'asc' },
        })
      : Promise.resolve([]),
  ])

  return { medicine, prices, similares }
}