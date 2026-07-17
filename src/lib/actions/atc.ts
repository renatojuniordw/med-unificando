'use server'

import { prisma } from "@/lib/prisma"

export async function getAtcLevels() {
  const result = await prisma.medicine.findMany({
    where: { atcCode: { not: '' } },
    select: { atcCode: true },
    distinct: ['atcCode'],
  })
  const all = result.filter(r => r.atcCode !== null) as { atcCode: string }[]

  const level1 = new Map<string, number>()
  const level2 = new Map<string, number>()
  const level3 = new Map<string, number>()
  const level4 = new Map<string, number>()

  for (const { atcCode } of all) {
    if (!atcCode) continue
    const code = atcCode.trim()

    const l1 = code.length >= 1 ? code.substring(0, 1) : code
    level1.set(l1, (level1.get(l1) || 0) + 1)

    if (code.length >= 3) {
      const l2 = code.substring(0, 3)
      level2.set(l2, (level2.get(l2) || 0) + 1)
    }

    if (code.length >= 4) {
      const l3 = code.substring(0, 4)
      level3.set(l3, (level3.get(l3) || 0) + 1)
    }

    if (code.length >= 5) {
      const l4 = code.substring(0, 5)
      level4.set(l4, (level4.get(l4) || 0) + 1)
    }
  }

  return {
    level1: Array.from(level1.entries()).map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count),
    level2: Array.from(level2.entries()).map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count),
    level3: Array.from(level3.entries()).map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count),
    level4: Array.from(level4.entries()).map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count),
  }
}

export async function getMedicinesByAtc(code: string) {
  return prisma.medicine.findMany({
    where: { atcCode: { startsWith: code, mode: 'insensitive' } },
    orderBy: { tradeName: 'asc' },
    take: 200,
  })
}
