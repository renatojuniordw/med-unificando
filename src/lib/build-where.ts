import type { SearchFilters } from "@/types"

// Busca OR por substring (case-insensitive) nos campos informados.
// Fonte única para o padrão de busca textual usado em actions e API.
export function buildQueryOr(fields: string[], query: string): Record<string, unknown>[] {
  return fields.map(field => ({
    [field]: { contains: query, mode: 'insensitive' },
  }))
}

export function buildWhere(filters?: SearchFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {}
  if (!filters) return where

  if (filters.reference) where.reference = { contains: filters.reference, mode: 'insensitive' }
  if (filters.activeIngredient) where.activeIngredient = { contains: filters.activeIngredient, mode: 'insensitive' }
  if (filters.tradeName) where.tradeName = { contains: filters.tradeName, mode: 'insensitive' }
  if (filters.similarHolder) where.similarHolder = { contains: filters.similarHolder, mode: 'insensitive' }
  if (filters.pharmaceuticalForm) where.pharmaceuticalForm = { contains: filters.pharmaceuticalForm, mode: 'insensitive' }
  if (filters.category) where.category = { contains: filters.category, mode: 'insensitive' }
  if (filters.status) where.status = { equals: filters.status, mode: 'insensitive' }
  if (filters.farmaciaPopular) where.farmaciaPopular = true

  if (filters.query) {
    where.AND = { OR: buildQueryOr(['tradeName', 'activeIngredient', 'reference'], filters.query) }
  }

  return where
}
