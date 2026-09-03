import { getMedicinesByIds, searchMedicinesForCompare } from '@/lib/actions/compare'
import { z } from 'zod'
import type { McpToolDefinition } from '../types'

const compareInputSchema = z
  .object({
    ids: z.array(z.number().int().positive()).min(1).max(10).optional(),
    query: z.string().min(2).optional(),
  })
  .refine((input) => input.ids || input.query, {
    message: 'Informe ids ou query para comparar medicamentos',
  })

export const compararMedicamentos = {
  name: 'comparar_medicamentos',
  description:
    'Compara medicamentos lado a lado a partir de IDs numéricos ou de um termo de busca (retorna até 10).',
  inputSchema: compareInputSchema,
  handler: async (input) => {
    if (input.ids) return getMedicinesByIds(input.ids)
    const found = await searchMedicinesForCompare(input.query!)
    return getMedicinesByIds(found.map((item) => item.id))
  },
} satisfies McpToolDefinition<typeof compareInputSchema>