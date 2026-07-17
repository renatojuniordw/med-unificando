'use server'

import { prisma } from "@/lib/prisma"
import * as XLSX from 'xlsx'
import type { SearchFilters } from "@/types"

function buildWhere(filters?: SearchFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {}
  if (!filters) return where

  if (filters.reference) where.reference = { contains: filters.reference, mode: 'insensitive' }
  if (filters.activeIngredient) where.activeIngredient = { contains: filters.activeIngredient, mode: 'insensitive' }
  if (filters.tradeName) where.tradeName = { contains: filters.tradeName, mode: 'insensitive' }
  if (filters.similarHolder) where.similarHolder = { contains: filters.similarHolder, mode: 'insensitive' }

  return where
}

export async function exportToExcel(filters?: SearchFilters): Promise<{ filename: string; buffer: Buffer }> {
  const where = buildWhere(filters)
  const data = await prisma.medicine.findMany({
    where,
    orderBy: { reference: 'asc' },
  })

  const worksheet = XLSX.utils.json_to_sheet(
    data.map((med: Record<string, unknown>) => ({
      Referência: med.reference,
      'Princípio Ativo': med.activeIngredient,
      'Nome Comercial': med.tradeName,
      'Detentor do Registro': med.similarHolder,
      'Forma Farmacêutica': med.pharmaceuticalForm,
      Concentração: med.concentration,
      'Data de Inclusão': med.inclusionDate,
      Categoria: med.category,
      'Medicamento Referência': med.referenceMedicine,
      'Código ATC': med.atcCode,
      Tarja: med.prescriptionType,
      Situação: med.status,
      Autorização: med.authorization,
      Apresentações: med.presentationCount,
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
  const rows = data.map((med: Record<string, unknown>) => [
    med.reference,
    med.activeIngredient,
    med.tradeName,
    med.similarHolder,
    med.pharmaceuticalForm,
    med.concentration,
    med.inclusionDate,
    med.category,
    med.referenceMedicine,
    med.atcCode,
    med.prescriptionType,
    med.status,
    med.authorization,
    med.presentationCount,
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
