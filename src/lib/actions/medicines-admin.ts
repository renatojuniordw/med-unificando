'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export interface AdminMedicineSummary {
  id: number
  tradeName: string
  reference: string
  activeIngredient: string
  status: string | null
}

export async function searchMedicinesForAdmin(query: string): Promise<AdminMedicineSummary[]> {
  const session = await auth()
  if (!session?.user) return []
  if (query.length < 2) return []

  const medicines = await prisma.medicine.findMany({
    where: {
      OR: [
        { reference: { contains: query, mode: 'insensitive' } },
        { activeIngredient: { contains: query, mode: 'insensitive' } },
        { tradeName: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: { id: true, tradeName: true, reference: true, activeIngredient: true, status: true },
    take: 20,
    orderBy: { tradeName: 'asc' },
  })

  return medicines
}

export async function getMedicineForEdit(id: number) {
  const session = await auth()
  if (!session?.user) return null

  return prisma.medicine.findUnique({ where: { id } })
}

export interface UpdateMedicineData {
  reference: string
  activeIngredient: string
  tradeName: string
  similarHolder: string
  pharmaceuticalForm: string
  concentration: string
  inclusionDate: string
  category: string
  referenceMedicine: string
  atcCode: string
  prescriptionType: string
  status: string
  authorization: string
  presentationCount: number
  synonyms: string
  indications: string
}

export async function updateMedicine(id: number, data: UpdateMedicineData) {
  const session = await auth()
  if (!session?.user) return { success: false, error: 'Não autorizado' }

  try {
    await prisma.medicine.update({ where: { id }, data })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `Erro ao salvar: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
    }
  }
}
