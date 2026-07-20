'use server'

import { prisma } from "@/lib/prisma"
import { buildWhere } from "@/lib/build-where"
import * as XLSX from 'xlsx'
import type { SearchFilters } from "@/types"

export async function exportToExcel(filters?: SearchFilters): Promise<{ filename: string; buffer: Buffer }> {
  const where = buildWhere(filters)
  const data = await prisma.medicine.findMany({
    where,
    orderBy: { reference: 'asc' },
  })

  const worksheet = XLSX.utils.json_to_sheet(
    data.map((medicine: Record<string, unknown>) => ({
      Referência: medicine.reference,
      'Princípio Ativo': medicine.activeIngredient,
      'Nome Comercial': medicine.tradeName,
      'Detentor do Registro': medicine.similarHolder,
      'Forma Farmacêutica': medicine.pharmaceuticalForm,
      Concentração: medicine.concentration,
      'Data de Inclusão': medicine.inclusionDate,
      Categoria: medicine.category,
      'Medicamento Referência': medicine.referenceMedicine,
      'Código ATC': medicine.atcCode,
      Tarja: medicine.prescriptionType,
      Situação: medicine.status,
      Autorização: medicine.authorization,
      Apresentações: medicine.presentationCount,
    }))
  )

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Medicamentos')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return {
    filename: `medicamentos-${new Date().toISOString().split('T')[0]}.xlsx`,
    buffer,
  }
}

export async function exportToCsv(filters?: SearchFilters): Promise<{ filename: string; text: string }> {
  const where = buildWhere(filters)
  const data = await prisma.medicine.findMany({
    where,
    orderBy: { reference: 'asc' },
  })

  const headers = ['Referência', 'Princípio Ativo', 'Nome Comercial', 'Detentor', 'Forma Farmacêutica', 'Concentração', 'Inclusão', 'Categoria', 'Medicamento Referência', 'Código ATC', 'Tarja', 'Situação', 'Autorização', 'Apresentações']
  const rows = data.map((medicine: Record<string, unknown>) => [
    medicine.reference,
    medicine.activeIngredient,
    medicine.tradeName,
    medicine.similarHolder,
    medicine.pharmaceuticalForm,
    medicine.concentration,
    medicine.inclusionDate,
    medicine.category,
    medicine.referenceMedicine,
    medicine.atcCode,
    medicine.prescriptionType,
    medicine.status,
    medicine.authorization,
    medicine.presentationCount,
  ])

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return {
    filename: `medicamentos-${new Date().toISOString().split('T')[0]}.csv`,
    text: csv,
  }
}
