import type { MedicineResult } from "@/types"

export const MEDICINE_EXPORT_HEADERS = [
  'Referência', 'Princípio Ativo', 'Nome Comercial', 'Detentor',
  'Forma Farmacêutica', 'Concentração', 'Inclusão', 'Categoria',
  'Medicamento Referência', 'Código ATC', 'Tarja', 'Situação',
  'Autorização', 'Apresentações',
]

export function escapeCsvCell(value: unknown): string {
  const str = value?.toString() ?? ''
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function medicineToExportRow(medicine: MedicineResult): (string | number)[] {
  return [
    medicine.reference,
    medicine.activeIngredient,
    medicine.tradeName,
    medicine.similarHolder,
    medicine.pharmaceuticalForm,
    medicine.concentration,
    medicine.inclusionDate,
    medicine.category ?? '',
    medicine.referenceMedicine ?? '',
    medicine.atcCode ?? '',
    medicine.prescriptionType ?? '',
    medicine.status ?? '',
    medicine.authorization ?? '',
    medicine.presentationCount?.toString() ?? '',
  ]
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  return [
    headers.join(','),
    ...rows.map(row => row.map(escapeCsvCell).join(',')),
  ].join('\n')
}

// Mapeia para as colunas "amigáveis" do Excel (chaves em pt-BR)
export function medicineToExportObject(medicine: MedicineResult): Record<string, string> {
  return {
    Referência: medicine.reference,
    'Princípio Ativo': medicine.activeIngredient,
    'Nome Comercial': medicine.tradeName,
    'Detentor do Registro': medicine.similarHolder,
    'Forma Farmacêutica': medicine.pharmaceuticalForm,
    Concentração: medicine.concentration,
    'Data de Inclusão': medicine.inclusionDate,
    Categoria: medicine.category ?? '',
    'Medicamento Referência': medicine.referenceMedicine ?? '',
    'Código ATC': medicine.atcCode ?? '',
    Tarja: medicine.prescriptionType ?? '',
    Situação: medicine.status ?? '',
    Autorização: medicine.authorization ?? '',
    Apresentações: medicine.presentationCount?.toString() ?? '',
  }
}