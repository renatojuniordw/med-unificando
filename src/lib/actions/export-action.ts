'use server'

import { prisma } from "@/lib/prisma"
import { buildWhere } from "@/lib/build-where"
import { normalizeMedicine } from "@/lib/format"
import {
  MEDICINE_EXPORT_HEADERS,
  medicineToExportObject,
  medicineToExportRow,
  toCsv,
} from "@/lib/csv-export"
import * as XLSX from 'xlsx'
import type { SearchFilters, MedicineResult } from "@/types"

export async function exportToExcel(filters?: SearchFilters): Promise<{ filename: string; buffer: number[] }> {
  const where = buildWhere(filters)
  const data = await prisma.medicine.findMany({
    where,
    orderBy: { reference: 'asc' },
  })

  const worksheet = XLSX.utils.json_to_sheet(
    (data as unknown as MedicineResult[]).map(normalizeMedicine).map(medicineToExportObject)
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

  const rows = (data as unknown as MedicineResult[])
    .map(normalizeMedicine)
    .map(medicineToExportRow)

  return {
    filename: `medicamentos-${new Date().toISOString().split('T')[0]}.csv`,
    text: toCsv(MEDICINE_EXPORT_HEADERS, rows),
  }
}
