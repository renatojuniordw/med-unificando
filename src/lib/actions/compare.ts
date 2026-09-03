'use server'

import { prisma } from "@/lib/prisma"
import { normalizeMedicine } from "@/lib/format"
import { buildQueryOr } from "@/lib/build-where"
import type { MedicineResult } from "@/types"

export async function getMedicinesByIds(ids: number[]): Promise<MedicineResult[]> {
  if (!ids.length) return []

  const data = await prisma.medicine.findMany({
    where: { id: { in: ids } },
  })

  return data.map(normalizeMedicine) as MedicineResult[]
}

export async function searchMedicinesForCompare(
  query: string
): Promise<{ id: number; label: string }[]> {
  if (query.length < 2) return []

  const data = await prisma.medicine.findMany({
    where: {
      OR: buildQueryOr(['reference', 'activeIngredient', 'tradeName'], query),
    },
    take: 10,
    orderBy: { reference: 'asc' },
  })

  return data.map((med) => ({
    id: med.id,
    label: `${med.reference} — ${med.tradeName} (${med.activeIngredient})`,
  }))
}
