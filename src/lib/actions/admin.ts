'use server'

import { prisma } from "@/lib/prisma"
import { withAdmin, withAdminReturn } from "@/lib/auth-guard"
import { downloadCsv, parseCsvToRows } from "@/lib/csv-utils"
import https from 'https'
import { revalidatePath } from 'next/cache'
import { anvisaAgent } from '@/lib/anvisa-https'
import { BATCH } from "@/lib/constants"
import { ANVISA } from "@/lib/config"
import { planDiff, type DiffRow } from '@/lib/sync-diff'
import type { ImportInfo } from "@/types"

const CSV_URL = ANVISA.MEDICINES_URL

// Campos de conteúdo que definem a identidade de uma linha no diff. anvisaFileDate,
// lastImportAt e metadados de auditoria ficam DE FORA (mudam a cada import e seriam
// um falso "update em tudo" no fingerprint).
const CONTENT_KEYS = [
  'reference',
  'activeIngredient',
  'tradeName',
  'similarHolder',
  'pharmaceuticalForm',
  'concentration',
  'inclusionDate',
  'category',
  'referenceMedicine',
  'atcCode',
  'prescriptionType',
  'status',
  'authorization',
  'presentationCount',
  'synonyms',
  'indications',
  'therapeuticClass',
] as const

const VALID_CATEGORIES = new Set([
  'SIMILAR', 'GENÉRICO', 'REFERÊNCIA', 'NOVO', 'ESPECÍFICO',
  'FITOTERÁPICO', 'BIOLÓGICO', 'DINAMIZADO', 'BAIXO RISCO',
  'GASES MEDICINAIS', 'RADIOFÁRMACO',
])

function parseCSV(csvText: string) {
  return parseCsvToRows(csvText)
}

export async function importPdf(formData: FormData) {
  return withAdmin(async () => {
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

      await prisma.$transaction(async (tx) => {
        // Impede importações concorrentes de varrerem o catálogo no meio.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('unificando_sync'))`

        await tx.medicine.deleteMany()

        const batchSize = BATCH.MEDICINE_IMPORT
        for (let i = 0; i < medicines.length; i += batchSize) {
          await tx.medicine.createMany({
            data: medicines.slice(i, i + batchSize) as never,
          })
        }
      }, { timeout: 120_000 })

      revalidatePath('/dashboard')
      revalidatePath('/atc')

      return {
        success: true,
        count: medicines.length,
        message: `${medicines.length} medicamentos importados com sucesso! (dados anteriores substituídos)`,
      }
    } catch (error) {
      console.error('Erro ao processar PDF:', error)
      return {
        success: false,
        error: 'Erro ao processar PDF. Verifique o arquivo e tente novamente.',
      }
    }
  })
}

function getHeader(url: string): Promise<Date | null> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { agent: anvisaAgent, method: 'HEAD' }, (res) => {
      resolve(res.headers['last-modified'] ? new Date(res.headers['last-modified']) : null)
      res.resume()
    })
    req.on('error', reject)
  })
}

function downloadCSV(url: string): Promise<string> {
  return downloadCsv(url)
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

async function bulkReplaceMedicines(
  medicines: Array<Record<string, unknown>>,
  remoteTimestamp: Date,
  now: Date
) {
  // Diff preservando IDS: URLs públicas (/medicamento/{slug}-{id}), favoritos e comparação
  // só quebram quando o id muda — aqui mantemos os ids estáveis entre imports.
  // Linhas idênticas ficam intactas, alteradas viram UPDATE, removidas viram DELETE,
  // novas viram INSERT; tudo dentro de uma transação (rollback se falhar no meio).
  const existing = await prisma.medicine.findMany({
    select: { id: true, ...Object.fromEntries(CONTENT_KEYS.map(k => [k, true])) },
  }) as unknown as DiffRow[]

  const { toCreate, toUpdate, toDeleteIds } = planDiff(existing, medicines, [...CONTENT_KEYS], 'reference')

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('unificando_sync'))`

    const batchSize = BATCH.MEDICINE_IMPORT
    for (let i = 0; i < toCreate.length; i += batchSize) {
      await tx.medicine.createMany({ data: toCreate.slice(i, i + batchSize) as never })
    }

    for (const { id, patch } of toUpdate) {
      await tx.medicine.update({ where: { id }, data: patch })
    }

    if (toDeleteIds.length > 0) {
      await tx.medicine.deleteMany({ where: { id: { in: toDeleteIds } } })
    }

    // Metadados de import em massa (mantém o skip-check de anvisaFileDate).
    await tx.$executeRaw`
      UPDATE medicines
      SET "anvisaFileDate" = ${remoteTimestamp}, "lastImportAt" = ${now}, "updatedAt" = ${now}
    `
  }, { timeout: 120_000 })
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
  return withAdmin(async () => {
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

      await bulkReplaceMedicines(medicines, remoteTimestamp, now)

      await prisma.syncLog.create({
        data: { type: 'medicines', count: medicines.length, status: 'success' },
      })

      // Invalida os caches de página (dashboard/atc usam unstable_cache 1h).
      revalidatePath('/dashboard')
      revalidatePath('/atc')

      const { regenerateEmbeddings } = await import('@/lib/actions/embeddings')
      regenerateEmbeddings().catch(err =>
        console.error('[sync] Background embedding regeneration failed:', err)
      )

      // Texto de busca: o trigger já preencheu vetores crus no insert; este
      // refinamento (fire-and-forget) eleva a qualidade com nomes ATC/forma resolvidos.
      const { refreshTsvector } = await import('@/lib/tsvector-refresh')
      refreshTsvector(prisma).catch(err =>
        console.error('[sync] Background tsvector refinement failed:', err)
      )

      return {
        success: true,
        message: `${medicines.length} medicamentos sincronizados. Índice de busca sendo atualizado em segundo plano.`,
        count: medicines.length,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'erro desconhecido'
      console.error('Erro ao sincronizar:', error)
      await prisma.syncLog.create({
        data: { type: 'medicines', count: 0, status: 'error', message },
      })
      return {
        success: false,
        error: 'Erro ao sincronizar com a ANVISA. Tente novamente.',
      }
    }
  })
}

export async function getSyncLogs() {
  return withAdminReturn([], async () => {
    return prisma.syncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  })
}

export async function getImportInfo(): Promise<ImportInfo | null> {
  return withAdminReturn(null, async () => {
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
  })
}
