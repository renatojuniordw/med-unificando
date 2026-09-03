import { getMedicineDetail } from '@/lib/actions/medicine-detail'
import { z } from 'zod'
import type { McpToolDefinition } from '../types'

const detailInputSchema = z.object({
  id: z.number().int().positive(),
})

export const detalheMedicamento = {
  name: 'detalhe_medicamento',
  description:
    'Retorna o detalhe completo de um medicamento por ID: dados ANVISA, preços CMED e medicamentos similares relacionados.',
  inputSchema: detailInputSchema,
  handler: async (input) => {
    const detail = await getMedicineDetail(input.id)
    if (!detail) return { error: 'Medicamento não encontrado' }
    return detail
  },
} satisfies McpToolDefinition<typeof detailInputSchema>