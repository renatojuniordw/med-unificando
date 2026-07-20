import type { MedicineResult, SearchFilters } from '@/types'

export type MedicineField = keyof Pick<
  MedicineResult,
  'reference' | 'activeIngredient' | 'tradeName' | 'similarHolder' | 'pharmaceuticalForm' | 'concentration'
>

export const MEDICINE_FIELDS: Record<keyof SearchFilters, string> = {
  reference: 'reference',
  activeIngredient: 'activeIngredient',
  tradeName: 'tradeName',
  similarHolder: 'similarHolder',
  pharmaceuticalForm: 'pharmaceuticalForm',
  category: 'category',
  status: 'status',
}

export interface TableColumn {
  key: string
  label: string
  mobile: boolean
}

export interface CompareItem {
  id: number
  label: string
}
