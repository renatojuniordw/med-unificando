import { getHolderMedicines, getHolderSummary } from '@/lib/actions/search'
import { z } from 'zod'
import type { McpToolDefinition } from '../types'
import { paginationShape } from './filters'

const holderMedicinesInputSchema = z.object({
  holder: z.string().min(1),
  ...paginationShape,
  search: z.string().optional(),
  status: z.string().optional(),
})

export const medicamentosPorDetentor = {
  name: 'medicamentos_por_detentor',
  description:
    'Lista medicamentos de um detentor (empresa titular do registro) com filtros opcionais de busca e situação, paginado.',
  inputSchema: holderMedicinesInputSchema,
  handler: async (input) =>
    getHolderMedicines(input.holder, input.page ?? 1, input.pageSize ?? 20, input.search, input.status),
} satisfies McpToolDefinition<typeof holderMedicinesInputSchema>

const holderSummaryInputSchema = z.object({
  holder: z.string().min(1),
})

export const resumoDetentor = {
  name: 'resumo_detentor',
  description:
    'Resumo de um detentor: nome normalizado, total de medicamentos, ativos e quantidade de categorias.',
  inputSchema: holderSummaryInputSchema,
  handler: async (input) => getHolderSummary(input.holder),
} satisfies McpToolDefinition<typeof holderSummaryInputSchema>