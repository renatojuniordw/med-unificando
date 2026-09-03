'use server'

import { prisma } from '@/lib/prisma'
import { withAdmin, withAdminReturn } from '@/lib/auth-guard'
import { buildQueryOr } from '@/lib/build-where'
import { z } from 'zod'

export interface AdminMedicineSummary {
  id: number
  tradeName: string
  reference: string
  activeIngredient: string
  status: string | null
}

export async function searchMedicinesForAdmin(query: string): Promise<AdminMedicineSummary[]> {
  return withAdminReturn([], async () => {
    if (query.length < 2) return []

    const medicines = await prisma.medicine.findMany({
      where: {
        OR: buildQueryOr(['reference', 'activeIngredient', 'tradeName'], query),
      },
      select: { id: true, tradeName: true, reference: true, activeIngredient: true, status: true },
      take: 20,
      orderBy: { tradeName: 'asc' },
    })

    return medicines
  })
}

export async function getMedicineForEdit(id: number) {
  return withAdminReturn(null, async () => {
    return prisma.medicine.findUnique({ where: { id } })
  })
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

const updateMedicineSchema = z.object({
  reference: z.string().trim().min(1).max(30),
  activeIngredient: z.string().trim().min(1).max(500),
  tradeName: z.string().trim().min(1).max(300),
  similarHolder: z.string().trim().min(1).max(300),
  pharmaceuticalForm: z.string().trim().max(50),
  concentration: z.string().trim().max(300),
  inclusionDate: z.string().trim().max(30),
  category: z.string().trim().max(50),
  referenceMedicine: z.string().trim().max(300),
  atcCode: z.string().trim().max(20),
  prescriptionType: z.string().trim().max(20),
  status: z.string().trim().max(20),
  authorization: z.string().trim().max(30),
  presentationCount: z.number().int().min(0).max(100000),
  synonyms: z.string().trim().max(1000),
  indications: z.string().trim().max(5000),
})

export async function updateMedicine(id: number, data: UpdateMedicineData) {
  return withAdmin(async () => {
    const parsed = updateMedicineSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: 'Dados inválidos: ' + parsed.error.issues.map(e => e.message).join('; ') }
    }

    try {
      await prisma.medicine.update({ where: { id }, data: parsed.data })
      return { success: true }
    } catch {
      return { success: false, error: 'Erro ao salvar o medicamento. Tente novamente.' }
    }
  })
}
