import type { SearchFilters } from "@/types"

export function buildWhere(filters?: SearchFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {}
  if (!filters) return where

  if (filters.reference) where.reference = { contains: filters.reference, mode: 'insensitive' }
  if (filters.activeIngredient) where.activeIngredient = { contains: filters.activeIngredient, mode: 'insensitive' }
  if (filters.tradeName) where.tradeName = { contains: filters.tradeName, mode: 'insensitive' }
  if (filters.similarHolder) where.similarHolder = { contains: filters.similarHolder, mode: 'insensitive' }
  if (filters.pharmaceuticalForm) where.pharmaceuticalForm = { contains: filters.pharmaceuticalForm, mode: 'insensitive' }
  if (filters.category) where.category = { contains: filters.category, mode: 'insensitive' }
  if (filters.status) where.status = { contains: filters.status, mode: 'insensitive' }

  return where
}
