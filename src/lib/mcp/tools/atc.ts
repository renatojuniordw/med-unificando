import { getAtcLevels, getMedicinesByAtc } from '@/lib/actions/atc'
import { z } from 'zod'
import type { McpToolDefinition } from '../types'
import { paginationShape } from './filters'

const atcLevelsInputSchema = z.object({})

export const arvoreAtc = {
  name: 'arvore_atc',
  description:
    'Retorna a árvore de classificação ATC (anatômico, terapêutico e químico) com contagem de medicamentos por código.',
  inputSchema: atcLevelsInputSchema,
  handler: async () => getAtcLevels(),
} satisfies McpToolDefinition<typeof atcLevelsInputSchema>

const medicinesByAtcInputSchema = z.object({
  code: z.string().min(1),
  ...paginationShape,
})

export const medicamentosPorAtc = {
  name: 'medicamentos_por_atc',
  description:
    'Lista medicamentos por código ATC (prefixo do código, ex.: "N02", "A", "N02BE"). Inclui totais e ativos.',
  inputSchema: medicinesByAtcInputSchema,
  handler: async (input) =>
    getMedicinesByAtc(input.code, input.page ?? 1, input.pageSize ?? 20),
} satisfies McpToolDefinition<typeof medicinesByAtcInputSchema>