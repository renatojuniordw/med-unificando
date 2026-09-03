import { searchAutocomplete, searchMedicines } from '@/lib/actions/search'
import { z } from 'zod'
import type { McpToolDefinition } from '../types'
import { medicineListSchema } from './filters'

const searchInputSchema = medicineListSchema

export const buscarMedicamentos = {
  name: 'buscar_medicamentos',
  description:
    'Lista medicamentos intercambiáveis com filtros opcionais (query, referência, princípio ativo, nome comercial, detentor, forma farmacêutica, categoria, situação, Farmácia Popular) e paginação.',
  inputSchema: searchInputSchema,
  handler: async (input) => {
    const { page, pageSize, ...filters } = input
    return searchMedicines(page ?? 1, pageSize ?? 10, filters)
  },
} satisfies McpToolDefinition<typeof searchInputSchema>

const autocompleteInputSchema = z.object({
  field: z.enum([
    'reference',
    'activeIngredient',
    'tradeName',
    'similarHolder',
    'pharmaceuticalForm',
    'category',
    'status',
  ]),
  q: z.string().min(1),
})

export const autocompleteCampo = {
  name: 'autocomplete_campo',
  description:
    'Sugere valores distintos de um campo da base (reference, activeIngredient, tradeName, similarHolder, pharmaceuticalForm, category, status) conforme o termo digitado.',
  inputSchema: autocompleteInputSchema,
  handler: async (input) => searchAutocomplete(input.field, input.q),
} satisfies McpToolDefinition<typeof autocompleteInputSchema>