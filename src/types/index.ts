export interface SearchFilters {
  reference?: string
  activeIngredient?: string
  tradeName?: string
  similarHolder?: string
  pharmaceuticalForm?: string
  category?: string
  status?: string
}

export interface MedicineResult {
  id: number
  reference: string
  activeIngredient: string
  tradeName: string
  similarHolder: string
  pharmaceuticalForm: string
  concentration: string
  inclusionDate: string
  category: string | null
  referenceMedicine: string | null
  atcCode: string | null
  prescriptionType: string | null
  status: string | null
  authorization: string | null
  presentationCount: number | null
  synonyms: string | null
  indications: string | null
  anvisaFileDate: Date | null
  lastImportAt: Date | null
}

export interface SearchResponse {
  data: MedicineResult[]
  total: number
  page: number
  pageSize: number
}

export interface DistinctValue {
  value: string
}

export interface DashboardStats {
  totalMedicines: number
  totalReferences: number
  topReferences: { name: string; count: number }[]
  topActiveIngredients: { name: string; count: number }[]
  ativoCount: number
  inativoCount: number
  categories: { name: string; count: number }[]
}

export interface ImportInfo {
  total: number
  lastImport: Date | null
  anvisaFileDate: Date | null
}
