import { z } from 'zod'

export const FEEDBACK_TYPES = ['helpful', 'not_helpful'] as const
export type FeedbackType = (typeof FEEDBACK_TYPES)[number]

// Schema único de validação do feedback de busca.
// Usado tanto pela server action (submitSearchFeedback) quanto pela rota
// pública POST /api/search-feedback, garantindo regras idênticas.
export const feedbackSchema = z.object({
  query: z.string('Query inválida').min(1, 'Query inválida').max(200, 'Query inválida'),
  medicineId: z.number('Medicamento inválido').int('Medicamento inválido').positive('Medicamento inválido'),
  medicineName: z.string('Nome do medicamento inválido').min(1, 'Nome do medicamento inválido').max(300, 'Nome do medicamento inválido'),
  feedback: z.enum(FEEDBACK_TYPES, { message: 'Tipo de feedback inválido' }),
})

export type FeedbackData = z.infer<typeof feedbackSchema>