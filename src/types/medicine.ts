import type { MedicineResult } from '@/types'

export type MedicineField = keyof Pick<
  MedicineResult,
  'reference' | 'activeIngredient' | 'tradeName' | 'similarHolder' | 'pharmaceuticalForm' | 'concentration'
>

export const MEDICINE_FIELDS: Record<string, string> = {
  reference: 'reference',
  activeIngredient: 'activeIngredient',
  tradeName: 'tradeName',
  similarHolder: 'similarHolder',
  pharmaceuticalForm: 'pharmaceuticalForm',
  category: 'category',
  status: 'status',
  farmaciaPopular: 'farmaciaPopular',
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
