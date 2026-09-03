'use server'

import { prisma } from '@/lib/prisma'
import { SEARCH } from '@/lib/config'

export async function trigramSearch(
  query: string,
  topK: number = SEARCH.HYBRID_TOP_K
): Promise<{ medicineId: number; trigramScore: number }[]> {
  if (!query.trim()) return []

  const sql = `
    SELECT id,
      GREATEST(
        similarity("tradeName", $1),
        similarity("activeIngredient", $1)
      ) AS trigram_score
    FROM medicines
    WHERE "tradeName" % $1
       OR "activeIngredient" % $1
    ORDER BY trigram_score DESC
    LIMIT $2
  `

  try {
    const rows = await prisma.$queryRawUnsafe<{ id: number; trigram_score: number }[]>(
      sql,
      query,
      topK,
    )

    return rows.map(r => ({
      medicineId: r.id,
      trigramScore: Number(r.trigram_score),
    }))
  } catch (error) {
    console.error(`[BUSCA DESCRIÇÃO] [Trigram] ❌ Erro ao executar busca trigram (extensão pg_trgm ativa no PostgreSQL?):`, error)
    return []
  }
}
