'use server'

import { prisma } from "@/lib/prisma"
import { MEDICINE_LIMITS } from "@/lib/constants"
import { normalizeMedicine } from "@/lib/format"

export async function getAtcLevels() {
  const result = await prisma.medicine.findMany({
    where: { atcCode: { not: '' } },
    select: { atcCode: true },
    distinct: ['atcCode'],
  })
  const all = result.filter(r => r.atcCode !== null) as { atcCode: string }[]

  const anatomicalLevel = new Map<string, number>()
  const therapeuticLevel = new Map<string, number>()
  const chemicalLevel = new Map<string, number>()

  for (const { atcCode } of all) {
    if (!atcCode) continue
    const code = atcCode.trim()

    const l1 = code.length >= 1 ? code.substring(0, 1) : code
    anatomicalLevel.set(l1, (anatomicalLevel.get(l1) || 0) + 1)

    if (code.length >= 3) {
      const l2 = code.substring(0, 3)
      therapeuticLevel.set(l2, (therapeuticLevel.get(l2) || 0) + 1)
    }

    if (code.length >= 4) {
      const l3 = code.substring(0, 4)
      chemicalLevel.set(l3, (chemicalLevel.get(l3) || 0) + 1)
    }
  }

  return {
    level1: Array.from(anatomicalLevel.entries()).map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count),
    level2: Array.from(therapeuticLevel.entries()).map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count),
    level3: Array.from(chemicalLevel.entries()).map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count),
  }
}

export async function getMedicinesByAtc(code: string) {
  const medicines = await prisma.medicine.findMany({
    where: { atcCode: { startsWith: code, mode: 'insensitive' } },
    orderBy: { tradeName: 'asc' },
    take: MEDICINE_LIMITS.MAX_ATC_RESULTS,
  })
  return medicines.map(normalizeMedicine)
}
