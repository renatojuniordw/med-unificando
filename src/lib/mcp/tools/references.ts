import {
  getReferenceMedicines,
  getSimilaresByReference,
  searchReferenceMedicines,
} from '@/lib/actions/references'
import { z } from 'zod'
import type { McpToolDefinition } from '../types'

const referencesInputSchema = z.object({
  query: z.string().optional(),
})

export const referenciasMedicamento = {
  name: 'referencias_medicamento',
  description:
    'Lista os medicamentos de referência disponíveis na base, opcionalmente filtrando por termo (nome da referência).',
  inputSchema: referencesInputSchema,
  handler: async (input) =>
    input.query?.trim()
      ? searchReferenceMedicines(input.query.trim())
      : getReferenceMedicines(),
} satisfies McpToolDefinition<typeof referencesInputSchema>

const similaresInputSchema = z.object({
  name: z.string().min(1),
})

export const similaresReferencia = {
  name: 'similares_referencia',
  description:
    'Lista os medicamentos similares de um medicamento de referência pelo nome (ex.: "DIPIRONA").',
  inputSchema: similaresInputSchema,
  handler: async (input) => getSimilaresByReference(input.name),
} satisfies McpToolDefinition<typeof similaresInputSchema>