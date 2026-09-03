import type { MedicineResult } from "@/types"

// Select mínimo dos campos de exportação — evita trafegar embedding (768d) e
// search_document nas consultas de export (payload pesado desnecessário).
export const EXPORT_MEDICINE_SELECT = {
  reference: true,
  activeIngredient: true,
  tradeName: true,
  similarHolder: true,
  pharmaceuticalForm: true,
  concentration: true,
  inclusionDate: true,
  category: true,
  referenceMedicine: true,
  atcCode: true,
  prescriptionType: true,
  status: true,
  authorization: true,
  presentationCount: true,
} as const

// Fonte única de verdade para a exportação de medicamentos.
// Tanto o CSV (medicineToExportRow) quanto o Excel/XLSX (medicineToExportObject)
// derivam desta tabela, evitando que os dois mapeadores divirjam.
// `header` é o nome da coluna no CSV; `objectKey`, o nome no Excel
// (2 campos usam labels diferentes nos dois formatos).
export const MEDICINE_EXPORT_FIELDS: {
  header: string
  objectKey: string
  get: (m: MedicineResult) => string
}[] = [
  { header: 'Referência', objectKey: 'Referência', get: m => m.reference },
  { header: 'Princípio Ativo', objectKey: 'Princípio Ativo', get: m => m.activeIngredient },
  { header: 'Nome Comercial', objectKey: 'Nome Comercial', get: m => m.tradeName },
  { header: 'Detentor', objectKey: 'Detentor do Registro', get: m => m.similarHolder },
  { header: 'Forma Farmacêutica', objectKey: 'Forma Farmacêutica', get: m => m.pharmaceuticalForm },
  { header: 'Concentração', objectKey: 'Concentração', get: m => m.concentration },
  { header: 'Inclusão', objectKey: 'Data de Inclusão', get: m => m.inclusionDate },
  { header: 'Categoria', objectKey: 'Categoria', get: m => m.category ?? '' },
  { header: 'Medicamento Referência', objectKey: 'Medicamento Referência', get: m => m.referenceMedicine ?? '' },
  { header: 'Código ATC', objectKey: 'Código ATC', get: m => m.atcCode ?? '' },
  { header: 'Tarja', objectKey: 'Tarja', get: m => m.prescriptionType ?? '' },
  { header: 'Situação', objectKey: 'Situação', get: m => m.status ?? '' },
  { header: 'Autorização', objectKey: 'Autorização', get: m => m.authorization ?? '' },
  { header: 'Apresentações', objectKey: 'Apresentações', get: m => m.presentationCount?.toString() ?? '' },
]

export const MEDICINE_EXPORT_HEADERS = MEDICINE_EXPORT_FIELDS.map(f => f.header)

export function escapeCsvCell(value: unknown): string {
  const str = value?.toString() ?? ''
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function medicineToExportRow(medicine: MedicineResult): (string | number)[] {
  return MEDICINE_EXPORT_FIELDS.map(f => f.get(medicine))
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  return [
    headers.join(','),
    ...rows.map(row => row.map(escapeCsvCell).join(',')),
  ].join('\n')
}

// Mapeia para as colunas "amigáveis" do Excel (chaves em pt-BR)
export function medicineToExportObject(medicine: MedicineResult): Record<string, string> {
  return Object.fromEntries(MEDICINE_EXPORT_FIELDS.map(f => [f.objectKey, f.get(medicine)]))
}