import { hybridSearch } from '@/lib/actions/semantic-search'
import { z } from 'zod'
import type { McpToolDefinition } from '../types'

const searchDescriptionInputSchema = z.object({
  query: z.string().min(1),
  topK: z.number().int().positive().max(50).optional(),
})

export const buscarPorDescricao = {
  name: 'buscar_por_descricao',
  description:
    'Busca semântica híbrida por descrição em linguagem natural (ex.: "queimação e dor no estômago"). Combina embeddings locais, busca textual e trigram. Primeira chamada pode carregar o modelo ONNX (mais lenta).',
  inputSchema: searchDescriptionInputSchema,
  handler: async (input) => hybridSearch(input.query, input.topK),
} satisfies McpToolDefinition<typeof searchDescriptionInputSchema>