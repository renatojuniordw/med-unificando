'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type FeedbackType = 'helpful' | 'not_helpful'

export interface FeedbackData {
  query: string
  medicineId: number
  medicineName: string
  feedback: FeedbackType
}

export interface FeedbackStats {
  total: number
  helpful: number
  notHelpful: number
  accuracy: number
  topQueries: { query: string; count: number; helpful: number; notHelpful: number }[]
  topMedicines: { medicineName: string; count: number; helpful: number; notHelpful: number }[]
}

export async function submitSearchFeedback(data: FeedbackData): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.query || !data.medicineId || !data.medicineName || !data.feedback) {
      return { success: false, error: 'Dados incompletos' }
    }

    if (!['helpful', 'not_helpful'].includes(data.feedback)) {
      return { success: false, error: 'Tipo de feedback inválido' }
    }

    await prisma.searchFeedback.create({
      data: {
        query: data.query.toLowerCase().trim(),
        medicineId: data.medicineId,
        medicineName: data.medicineName,
        feedback: data.feedback,
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

export async function getFeedbackStats(): Promise<FeedbackStats> {
  try {
    const allFeedbacks = await prisma.searchFeedback.findMany()

    const total = allFeedbacks.length
    const helpful = allFeedbacks.filter(f => f.feedback === 'helpful').length
    const notHelpful = allFeedbacks.filter(f => f.feedback === 'not_helpful').length
    const accuracy = total > 0 ? Math.round((helpful / total) * 100) : 0

    // Top queries com feedback
    const queryMap = new Map<string, { count: number; helpful: number; notHelpful: number }>()
    for (const f of allFeedbacks) {
      const entry = queryMap.get(f.query) || { count: 0, helpful: 0, notHelpful: 0 }
      entry.count++
      if (f.feedback === 'helpful') entry.helpful++
      else entry.notHelpful++
      queryMap.set(f.query, entry)
    }

    const topQueries = Array.from(queryMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([query, data]) => ({ query, ...data }))

    // Top medicamentos com feedback
    const medicineMap = new Map<string, { count: number; helpful: number; notHelpful: number }>()
    for (const f of allFeedbacks) {
      const entry = medicineMap.get(f.medicineName) || { count: 0, helpful: 0, notHelpful: 0 }
      entry.count++
      if (f.feedback === 'helpful') entry.helpful++
      else entry.notHelpful++
      medicineMap.set(f.medicineName, entry)
    }

    const topMedicines = Array.from(medicineMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([medicineName, data]) => ({ medicineName, ...data }))

    return { total, helpful, notHelpful, accuracy, topQueries, topMedicines }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return { total: 0, helpful: 0, notHelpful: 0, accuracy: 0, topQueries: [], topMedicines: [] }
  }
}

export async function getFeedbackByQuery(query: string): Promise<{ medicineName: string; total: number; helpful: number; notHelpful: number }[]> {
  try {
    const feedbacks = await prisma.searchFeedback.findMany({
      where: { query: query.toLowerCase().trim() },
      orderBy: { createdAt: 'desc' },
    })

    const medicineMap = new Map<string, { total: number; helpful: number; notHelpful: number }>()
    for (const f of feedbacks) {
      const entry = medicineMap.get(f.medicineName) || { total: 0, helpful: 0, notHelpful: 0 }
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
}

export async function getLowQualityQueries(): Promise<{ query: string; total: number; helpful: number; notHelpful: number; accuracy: number }[]> {
  try {
    const feedbacks = await prisma.searchFeedback.findMany()

    const queryMap = new Map<string, { total: number; helpful: number; notHelpful: number }>()
    for (const f of feedbacks) {
      const entry = queryMap.get(f.query) || { total: 0, helpful: 0, notHelpful: 0 }
      entry.total++
      if (f.feedback === 'helpful') entry.helpful++
      else entry.notHelpful++
      queryMap.set(f.query, entry)
    }

    return Array.from(queryMap.entries())
      .map(([query, data]) => ({
        query,
        ...data,
        accuracy: data.total > 0 ? Math.round((data.helpful / data.total) * 100) : 0,
      }))
      .filter(q => q.accuracy < 50 && q.total >= 3) // Pelo menos 3 feedbacks e < 50% de aprovação
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 20)
  } catch (error) {
    console.error('Erro ao buscar queries de baixa qualidade:', error)
    return []
  }
}