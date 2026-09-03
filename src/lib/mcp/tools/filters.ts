import { z } from 'zod'

/**
 * Filtros de busca — espelham `SearchFilters` de `src/types/index.ts` e
 * `buildWhere` de `src/lib/build-where.ts`. Todas as propriedades são
 * opcionais e aceitas por `searchMedicines`.
 */
export const medicineFiltersSchema = z.object({
  query: z.string().optional(),
  reference: z.string().optional(),
  activeIngredient: z.string().optional(),
  tradeName: z.string().optional(),
  similarHolder: z.string().optional(),
  pharmaceuticalForm: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  farmaciaPopular: z.boolean().optional(),
})

/** Paginação padrão das listagens (clamp igual ao das rotas /api). */
export const paginationShape = {
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
}

/** Schema de busca com filtros + paginação (usado pelas tools de listagem). */
export const medicineListSchema = medicineFiltersSchema.extend(paginationShape)