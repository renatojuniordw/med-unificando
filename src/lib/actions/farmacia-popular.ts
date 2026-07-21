'use server'

import { prisma } from '@/lib/prisma'
import { FARMACIA_POPULAR_ATIVOS } from '@/lib/actions/farmacia-popular-ativos'

export async function syncFarmaciaPopular() {
  try {
    await prisma.medicine.updateMany({
      where: { farmaciaPopular: true },
      data: { farmaciaPopular: false },
    })

    const conditions = FARMACIA_POPULAR_ATIVOS.map(ativo => ({
      activeIngredient: { contains: ativo, mode: 'insensitive' as const },
    }))

    const result = await prisma.medicine.updateMany({
      where: { OR: conditions },
      data: { farmaciaPopular: true },
    })

    await prisma.syncLog.create({
      data: {
        type: 'farmacia-popular',
        count: result.count,
        status: 'success',
      },
    })

    return { success: true, count: result.count, message: `${result.count} medicamentos marcados com Farmácia Popular.` }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    await prisma.syncLog.create({
      data: {
        type: 'farmacia-popular',
        count: 0,
        status: 'error',
        message,
      },
    })
    return { success: false, error: message }
  }
}
