import { getDashboardStats, getFilteredStats } from '@/lib/actions/search'
import { z } from 'zod'
import type { McpToolDefinition } from '../types'

const statsInputSchema = z.object({
  year: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
})

export const estatisticasMedicamentos = {
  name: 'estatisticas_medicamentos',
  description:
    'Estatísticas da base: total de medicamentos, referências, ativos/inativos, categorias e timeline. Aceita filtros opcionais (ano, categoria, situação) para estatísticas filtradas.',
  inputSchema: statsInputSchema,
  handler: async (input) => {
    if (input.year || input.category || input.status) {
      return getFilteredStats({ year: input.year, category: input.category, status: input.status })
    }
    return getDashboardStats()
  },
} satisfies McpToolDefinition<typeof statsInputSchema>