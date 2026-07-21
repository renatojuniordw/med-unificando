'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { generateEmbeddings } from '@/lib/embeddings-generator'

export async function regenerateEmbeddings() {
  const session = await auth()
  if (!session?.user) return { success: false, error: 'Não autorizado' }

  try {
    const medicines = await prisma.medicine.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true, reference: true, tradeName: true, activeIngredient: true,
        category: true, similarHolder: true, pharmaceuticalForm: true,
        concentration: true, status: true, synonyms: true, indications: true,
        therapeuticClass: true, atcCode: true, prescriptionType: true,
        farmaciaPopular: true,
      },
    })

    if (medicines.length === 0) {
      return { success: false, error: 'Nenhum medicamento encontrado para gerar embeddings' }
    }

    const result = await generateEmbeddings(medicines, '')

    await prisma.syncLog.create({
      data: { type: 'embeddings', count: result.count, status: 'success' },
    })

    return {
      success: true,
      count: result.count,
      message: `${result.count} embeddings gerados no banco de dados`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erro desconhecido'
    await prisma.syncLog.create({
      data: { type: 'embeddings', count: 0, status: 'error', message },
    })
    return { success: false, error: `Erro ao gerar embeddings: ${message}` }
  }
}
