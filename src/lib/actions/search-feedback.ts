'use server'

import { prisma } from '@/lib/prisma'
import { withAdminReturn } from '@/lib/auth-guard'
import { normalizeQuery } from '@/lib/text-utils'
import { revalidatePath } from 'next/cache'
import { feedbackSchema } from '@/lib/feedback-schema'
import { checkActionRateLimit, RATE_LIMIT_ERROR } from '@/lib/rate-limit-action'

export type { FeedbackType, FeedbackData } from '@/lib/feedback-schema'

export interface FeedbackStats {
  total: number
  helpful: number
  notHelpful: number
  accuracy: number
  topQueries: { query: string; count: number; helpful: number; notHelpful: number }[]
  topMedicines: { medicineName: string; count: number; helpful: number; notHelpful: number }[]
}

export async function submitSearchFeedback(data: unknown): Promise<{ success: boolean; error?: string }> {
  // Mesmo limite da rota POST /api/search-feedback (20/min) — a action não pode
  // desviar do rate limit simplesmente chamando a action em vez da API.
  const { allowed } = await checkActionRateLimit('search-feedback', 20)
  if (!allowed) {
    return { success: false, error: RATE_LIMIT_ERROR }
  }

  const parsed = feedbackSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  try {
    await prisma.searchFeedback.create({
      data: {
        query: normalizeQuery(parsed.data.query),
        medicineId: parsed.data.medicineId,
        medicineName: parsed.data.medicineName,
        feedback: parsed.data.feedback,
      },
    })

    revalidatePath('/admin/search-feedback')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro ao salvar feedback:', message)
    return { success: false, error: message }
  }
}

type FeedbackAgg = { total: number; helpful: number; notHelpful: number }

// Agrega feedbacks por campo (query ou medicineName) usando groupBy do Prisma.
// Substitui o findMany() full-table que carregava todos os registros em memória.
async function groupFeedbackByField(field: 'query' | 'medicineName'): Promise<Map<string, FeedbackAgg>> {
  const grouped = await prisma.searchFeedback.groupBy({
    by: [field, 'feedback'],
    _count: { _all: true },
  })

  const map = new Map<string, FeedbackAgg>()
  for (const g of grouped) {
    const key = field === 'query' ? g.query : g.medicineName
    const entry = map.get(key) ?? { total: 0, helpful: 0, notHelpful: 0 }
    const count = g._count._all
    entry.total += count
    if (g.feedback === 'helpful') entry.helpful += count
    else entry.notHelpful += count
    map.set(key, entry)
  }
  return map
}

function topByDesc(map: Map<string, FeedbackAgg>): (FeedbackAgg & { key: string })[] {
  return Array.from(map.entries())
    .map(([key, data]) => ({ key, ...data }))
    .sort((a, b) => b.total - a.total)
}

export async function getFeedbackStats(): Promise<FeedbackStats> {
  return withAdminReturn({
    total: 0, helpful: 0, notHelpful: 0, accuracy: 0, topQueries: [], topMedicines: [],
  }, async () => {
    try {
      const [queryMap, medicineMap] = await Promise.all([
        groupFeedbackByField('query'),
        groupFeedbackByField('medicineName'),
      ])

      let total = 0
      let helpful = 0
      let notHelpful = 0
      for (const agg of queryMap.values()) {
        total += agg.total
        helpful += agg.helpful
        notHelpful += agg.notHelpful
      }
      const accuracy = total > 0 ? Math.round((helpful / total) * 100) : 0

      const topQueries = topByDesc(queryMap).slice(0, 20)
        .map(({ key, total, helpful, notHelpful }) => ({ query: key, count: total, helpful, notHelpful }))
      const topMedicines = topByDesc(medicineMap).slice(0, 20)
        .map(({ key, total, helpful, notHelpful }) => ({ medicineName: key, count: total, helpful, notHelpful }))

      return { total, helpful, notHelpful, accuracy, topQueries, topMedicines }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return { total: 0, helpful: 0, notHelpful: 0, accuracy: 0, topQueries: [], topMedicines: [] }
    }
  })
}

export async function getFeedbackByQuery(query: string): Promise<{ medicineName: string; total: number; helpful: number; notHelpful: number }[]> {
  return withAdminReturn([], async () => {
    try {
      const feedbacks = await prisma.searchFeedback.findMany({
        where: { query: normalizeQuery(query) },
        select: { medicineName: true, feedback: true },
        orderBy: { createdAt: 'desc' },
      })

      const medicineMap = new Map<string, FeedbackAgg>()
      for (const f of feedbacks) {
        const entry = medicineMap.get(f.medicineName) ?? { total: 0, helpful: 0, notHelpful: 0 }
        entry.total++
        if (f.feedback === 'helpful') entry.helpful++
        else entry.notHelpful++
        medicineMap.set(f.medicineName, entry)
      }

      return Array.from(medicineMap.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .map(([medicineName, data]) => ({ medicineName, ...data }))
    } catch (error) {
      console.error('Erro ao buscar feedback por query:', error)
      return []
    }
  })
}

export async function getLowQualityQueries(): Promise<{ query: string; total: number; helpful: number; notHelpful: number; accuracy: number }[]> {
  return withAdminReturn([], async () => {
    try {
      const queryMap = await groupFeedbackByField('query')

      return Array.from(queryMap.entries())
        .map(([query, data]) => ({
          query,
          total: data.total,
          helpful: data.helpful,
          notHelpful: data.notHelpful,
          accuracy: data.total > 0 ? Math.round((data.helpful / data.total) * 100) : 0,
        }))
        .filter(q => q.accuracy < 50 && q.total >= 3) // Pelo menos 3 feedbacks e < 50% de aprovação
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 20)
    } catch (error) {
      console.error('Erro ao buscar queries de baixa qualidade:', error)
      return []
    }
  })
}