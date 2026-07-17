'use server'

import { prisma } from "@/lib/prisma"

export async function getReferenceMedicines() {
  const groups = await prisma.medicine.groupBy({
    by: ['referenceMedicine'],
    _count: { referenceMedicine: true },
    where: {
      referenceMedicine: { not: '', notIn: ['0'] },
    },
    orderBy: { _count: { referenceMedicine: 'desc' } },
    take: 100,
  })

  return groups
    .filter((g): g is typeof g & { referenceMedicine: string } => !!g.referenceMedicine && g.referenceMedicine.length > 2)
    .map(g => ({
      name: g.referenceMedicine,
      count: g._count.referenceMedicine,
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
    take: 20,
  })

  return groups
    .filter((g): g is typeof g & { referenceMedicine: string } => !!g.referenceMedicine && g.referenceMedicine.length > 2)
    .map(g => ({
      name: g.referenceMedicine,
      count: g._count.referenceMedicine,
    }))
}
