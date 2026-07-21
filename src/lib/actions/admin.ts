'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import * as XLSX from 'xlsx'
import https from 'https'
import iconv from 'iconv-lite'
import { BATCH } from "@/lib/constants"
import { ANVISA } from "@/lib/config"
import type { ImportInfo } from "@/types"

const CSV_URL = ANVISA.MEDICINES_URL

const VALID_CATEGORIES = new Set([
  'SIMILAR', 'GENÉRICO', 'REFERÊNCIA', 'NOVO', 'ESPECÍFICO',
  'FITOTERÁPICO', 'BIOLÓGICO', 'DINAMIZADO', 'BAIXO RISCO',
  'GASES MEDICINAIS', 'RADIOFÁRMACO',
])

const agent = new https.Agent({ rejectUnauthorized: false })

// xlsx@0.18.5 has known vulnerabilities (prototype pollution, ReDoS).
// Risk is mitigated because: 1) CSV comes from ANVISA (trusted source), 2) not user-uploaded.
// TODO: Replace xlsx with a safer CSV parser when fix becomes available.
function parseCSV(csvText: string) {
  const sanitized = csvText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  const workbook = XLSX.read(sanitized, { type: 'string', raw: true })
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

function validateRow(reference: string, category: string, validCategories: Set<string>): boolean {
  if (!reference) return false
  if (category && !validCategories.has(category.toUpperCase())) return false
  return true
}

function buildTherapeuticClassMap(rows: Record<string, string>[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const row of rows) {
    const reference = String(row['NUMERO_REGISTRO_PRODUTO'] ?? '').trim()
    const therapeuticClass = (row['CLASSE_TERAPEUTICA'] ?? '').trim()
    if (reference && therapeuticClass) map.set(reference, therapeuticClass)
  }
  return map
}

function transformRow(
  row: Record<string, string>,
  remoteTimestamp: Date,
  now: Date,
  therapeuticClassByReference: Map<string, string>
): Record<string, unknown> | null {
  const reference = (row['NU_REGISTRO_PRODUTO'] ?? '').trim()
  const category = (row['DS_TIPO_CATEGORIA_REGULATORIA'] ?? '').trim()

  if (!validateRow(reference, category, VALID_CATEGORIES)) return null

  return {
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
    synonyms: (row['SINONIMOS'] ?? '').trim(),
    indications: (row['INDICACOES'] ?? '').trim(),
    therapeuticClass: therapeuticClassByReference.get(reference) ?? null,
    anvisaFileDate: remoteTimestamp,
    lastImportAt: now,
  }
}

async function bulkReplaceMedicines(medicines: Array<Record<string, unknown>>) {
  await prisma.medicine.deleteMany()

  const batchSize = BATCH.MEDICINE_IMPORT
  for (let i = 0; i < medicines.length; i += batchSize) {
    const batch = medicines.slice(i, i + batchSize)
    await prisma.medicine.createMany({ data: batch as never })
  }
}

function fetchAndParseCSV(url: string) {
  return downloadCSV(url).then(csvText => {
    const rows = parseCSV(csvText)
    if (rows.length === 0) throw new Error('CSV vazio ou inválido')
    return rows
  })
}

async function fetchTherapeuticClassWithRetry(url: string, retries = 2): Promise<Record<string, string>[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchAndParseCSV(url)
    } catch (err) {
      if (attempt < retries) {
        console.warn(`[sync] Therapeutic class CSV fetch attempt ${attempt + 1} failed, retrying...`)
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
      } else {
        console.error(`[sync] Therapeutic class CSV fetch failed after ${retries + 1} attempts:`, err)
        await prisma.syncLog.create({
          data: {
            type: 'therapeutic_class',
            count: 0,
            status: 'error',
            message: `CSV fetch failed after ${retries + 1} attempts: ${err instanceof Error ? err.message : 'unknown error'}`,
          },
        })
      }
    }
  }
  return []
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

    const [rows, therapeuticClassRows] = await Promise.all([
      fetchAndParseCSV(CSV_URL),
      fetchTherapeuticClassWithRetry(ANVISA.THERAPEUTIC_CLASS_URL),
    ])
    const therapeuticClassByReference = buildTherapeuticClassMap(therapeuticClassRows)
    const now = new Date()
    const medicines: Array<Record<string, unknown>> = []

    for (const row of rows) {
      const medicine = transformRow(row, remoteTimestamp, now, therapeuticClassByReference)
      if (medicine) medicines.push(medicine)
    }

    if (medicines.length === 0) {
      return { success: false, error: 'Nenhum medicamento encontrado no CSV' }
    }

    await bulkReplaceMedicines(medicines)

    await prisma.syncLog.create({
      data: { type: 'medicines', count: medicines.length, status: 'success' },
    })

    return {
      success: true,
      message: `${medicines.length} medicamentos sincronizados com a ANVISA!`,
      count: medicines.length,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erro desconhecido'
    await prisma.syncLog.create({
      data: { type: 'medicines', count: 0, status: 'error', message },
    })
    return {
      success: false,
      error: `Erro ao sincronizar: ${message}`,
    }
  }
}

export async function getSyncLogs() {
  const session = await auth()
  if (!session?.user) return []

  return prisma.syncLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
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
    medicinesUrl: ANVISA.MEDICINES_URL,
    pricesUrl: ANVISA.PRICES_URL,
  }
}
