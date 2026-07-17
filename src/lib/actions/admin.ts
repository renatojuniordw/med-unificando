'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import * as XLSX from 'xlsx'
import https from 'https'
import iconv from 'iconv-lite'
import type { ImportInfo } from "@/types"

const CSV_URL = 'https://dados.anvisa.gov.br/dados/CONSULTAS/PRODUTOS/TA_CONSULTA_MEDICAMENTOS.CSV'

const VALID_CATEGORIES = new Set([
  'Similar', 'Genérico', 'Referência', 'Novo', 'Específico',
  'Fitoterápico', 'Biológico', 'Dinamizado', 'BAIXO RISCO',
  'DINAMIZADO', 'Gases Medicinais', 'Radiofármaco',
])

function parseCSV(csvText: string) {
  const workbook = XLSX.read(csvText, { type: 'string', raw: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const data: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  return data
}

export async function importPdf(formData: FormData) {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: 'Não autorizado' }
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return { success: false, error: 'Nenhum arquivo enviado' }
  }

  if (!file.name.endsWith('.pdf')) {
    return { success: false, error: 'Formato inválido. Envie um arquivo .pdf' }
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { parseMedicinePDF } = await import('@/lib/pdf-parser')
    const medicines = await parseMedicinePDF(buffer)

    if (medicines.length === 0) {
      return { success: false, error: 'Nenhum medicamento encontrado no PDF' }
    }

    await prisma.medicine.deleteMany()

    let count = 0
    for (const med of medicines) {
      await prisma.medicine.create({ data: med })
      count++
    }

    return {
      success: true,
      count,
      message: `${count} medicamentos importados com sucesso! (dados anteriores substituídos)`,
    }
  } catch (error) {
    return {
      success: false,
      error: `Erro ao processar PDF: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
    }
  }
}

const agent = new https.Agent({ rejectUnauthorized: false })

function getHeader(url: string): Promise<Date | null> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { agent, method: 'HEAD' }, (res) => {
      resolve(res.headers['last-modified'] ? new Date(res.headers['last-modified']) : null)
      res.resume()
    })
    req.on('error', reject)
  })
}

function downloadCSV(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { agent }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => resolve(iconv.decode(Buffer.concat(chunks), 'latin1')))
      res.on('error', reject)
    }).on('error', reject)
  })
}

export async function syncWithAnvisa() {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Não autorizado' }
  }

  try {
    const remoteDate = await getHeader(CSV_URL)
    const remoteTimestamp = remoteDate ?? new Date()

    const currentMedicine = await prisma.medicine.findFirst({
      orderBy: { lastImportAt: 'desc' },
      select: { anvisaFileDate: true },
    })

    if (currentMedicine?.anvisaFileDate && remoteDate) {
      const storedMs = new Date(currentMedicine.anvisaFileDate).getTime()
      const remoteMs = remoteTimestamp.getTime()
      if (Math.abs(storedMs - remoteMs) < 60000) {
        const total = await prisma.medicine.count()
        return {
          success: true,
          message: 'Dados já estão atualizados com a versão mais recente da ANVISA.',
          count: total,
          skipped: true,
        }
      }
    }

    const csvText = await downloadCSV(CSV_URL)

    const rows = parseCSV(csvText)
    if (rows.length === 0) {
      return { success: false, error: 'CSV vazio ou inválido' }
    }

    const now = new Date()
    const medicines: Array<Record<string, unknown>> = []

    for (const row of rows) {
      const reference = (row['NU_REGISTRO_PRODUTO'] ?? '').trim()
      if (!reference) continue

      const category = (row['DS_TIPO_CATEGORIA_REGULATORIA'] ?? '').trim()
      if (category && !VALID_CATEGORIES.has(category)) continue

      medicines.push({
        reference,
        activeIngredient: (row['SUBSTANCIAS_MEDICAMENTOS'] ?? '').trim(),
        tradeName: (row['NO_PRODUTO'] ?? '').trim(),
        similarHolder: (row['NO_RAZAO_SOCIAL_EMPRESA'] ?? '').trim(),
        pharmaceuticalForm: (row['CO_FORMA_FISICA'] ?? '').trim(),
        concentration: (row['COMPLEMENTO'] ?? '').trim(),
        inclusionDate: (row['DATA_PUBLICACAO'] ?? '').trim().split(' ')[0],
        category,
        referenceMedicine: (row['DS_REFERENCIA'] ?? '').trim(),
        atcCode: (row['CO_ATC'] ?? '').trim(),
        prescriptionType: (row['CO_TARJA'] ?? '').trim(),
        status: (row['VALIDADE_SITUACAO'] ?? '').trim(),
        authorization: (row['AUTORIZACAO_MEDICAMENTO'] ?? '').trim(),
        presentationCount: parseInt((row['NUMERO_APRESENTACOES'] ?? '').trim(), 10) || 0,
        anvisaFileDate: remoteTimestamp,
        lastImportAt: now,
      })
    }

    if (medicines.length === 0) {
      return { success: false, error: 'Nenhum medicamento encontrado no CSV' }
    }

    await prisma.medicine.deleteMany()

    const batchSize = 500
    for (let i = 0; i < medicines.length; i += batchSize) {
      const batch = medicines.slice(i, i + batchSize)
      await prisma.medicine.createMany({ data: batch as never })
    }

    return {
      success: true,
      message: `${medicines.length} medicamentos sincronizados com a ANVISA!`,
      count: medicines.length,
    }
  } catch (error) {
    return {
      success: false,
      error: `Erro ao sincronizar: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
    }
  }
}

export async function getImportInfo(): Promise<ImportInfo | null> {
  const session = await auth()
  if (!session?.user) return null

  const total = await prisma.medicine.count()
  const lastMedicine = await prisma.medicine.findFirst({
    orderBy: { lastImportAt: 'desc' },
  })

  return {
    total,
    lastImport: lastMedicine?.lastImportAt ?? null,
    anvisaFileDate: lastMedicine?.anvisaFileDate ?? null,
  }
}
