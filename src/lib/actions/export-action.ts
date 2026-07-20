'use server'

import { prisma } from "@/lib/prisma"
import { buildWhere } from "@/lib/build-where"
import * as XLSX from 'xlsx'
import type { SearchFilters, MedicineResult } from "@/types"

function escapeCsvCell(value: unknown): string {
  const str = value?.toString() ?? ''
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function mapMedicine(medicine: MedicineResult) {
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

export async function exportToExcel(filters?: SearchFilters): Promise<{ filename: string; buffer: number[] }> {
  const where = buildWhere(filters)
  const data = await prisma.medicine.findMany({
    where,
    orderBy: { reference: 'asc' },
  })

  const worksheet = XLSX.utils.json_to_sheet(
    (data as unknown as MedicineResult[]).map(mapMedicine)
  )

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Medicamentos')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return {
    filename: `medicamentos-${new Date().toISOString().split('T')[0]}.xlsx`,
    buffer: Array.from(buffer),
  }
}

export async function exportToCsv(filters?: SearchFilters): Promise<{ filename: string; text: string }> {
  const where = buildWhere(filters)
  const data = await prisma.medicine.findMany({
    where,
    orderBy: { reference: 'asc' },
  })

  const headers = ['Referência', 'Princípio Ativo', 'Nome Comercial', 'Detentor', 'Forma Farmacêutica', 'Concentração', 'Inclusão', 'Categoria', 'Medicamento Referência', 'Código ATC', 'Tarja', 'Situação', 'Autorização', 'Apresentações']
  const rows = (data as unknown as MedicineResult[]).map(medicine => [
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
  ])

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n')

  return {
    filename: `medicamentos-${new Date().toISOString().split('T')[0]}.csv`,
    text: csv,
  }
}
