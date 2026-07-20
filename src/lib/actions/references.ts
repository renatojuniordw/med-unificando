'use server'

import { prisma } from "@/lib/prisma"
import { MEDICINE_LIMITS } from "@/lib/constants"

export async function getReferenceMedicines() {
  const groups = await prisma.medicine.groupBy({
    by: ['referenceMedicine'],
    _count: { referenceMedicine: true },
    where: {
      referenceMedicine: { not: '', notIn: ['0'] },
    },
    orderBy: { _count: { referenceMedicine: 'desc' } },
    take: MEDICINE_LIMITS.MAX_REFERENCES,
  })

  return groups
    .filter((group): group is typeof group & { referenceMedicine: string } => !!group.referenceMedicine && group.referenceMedicine.length > 2)
    .map(group => ({
      name: group.referenceMedicine,
      count: group._count.referenceMedicine,
    }))
}

export async function getSimilaresByReference(name: string) {
  return prisma.medicine.findMany({
    where: {
      referenceMedicine: { equals: name, mode: 'insensitive' },
    },
    orderBy: { tradeName: 'asc' },
  })
}

export async function searchReferenceMedicines(query: string) {
  const groups = await prisma.medicine.groupBy({
    by: ['referenceMedicine'],
    _count: { referenceMedicine: true },
    where: {
      referenceMedicine: {
        contains: query,
        mode: 'insensitive',
        not: '',
        notIn: ['0'],
      },
    },
    orderBy: { _count: { referenceMedicine: 'desc' } },
    take: MEDICINE_LIMITS.SEARCH_LIMIT,
  })

  return groups
    .filter((group): group is typeof group & { referenceMedicine: string } => !!group.referenceMedicine && group.referenceMedicine.length > 2)
    .map(group => ({
      name: group.referenceMedicine,
      count: group._count.referenceMedicine,
    }))
}
