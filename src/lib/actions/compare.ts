'use server'

import { prisma } from "@/lib/prisma"
import type { MedicineResult } from "@/types"

export async function getMedicinesByIds(ids: number[]): Promise<MedicineResult[]> {
  if (!ids.length) return []

  const data = await prisma.medicine.findMany({
    where: { id: { in: ids } },
  })

  return data as MedicineResult[]
}

export async function searchMedicinesForCompare(
  query: string
): Promise<{ id: number; label: string }[]> {
  if (query.length < 2) return []

  const data = await prisma.medicine.findMany({
    where: {
      OR: [
        { reference: { contains: query, mode: 'insensitive' } },
        { activeIngredient: { contains: query, mode: 'insensitive' } },
        { tradeName: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 10,
    orderBy: { reference: 'asc' },
  })

  return data.map((med) => ({
    id: med.id,
    label: `${med.reference} — ${med.tradeName} (${med.activeIngredient})`,
  }))
}
