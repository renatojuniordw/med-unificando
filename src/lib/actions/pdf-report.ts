'use server'

import PdfPrinter from 'pdfmake'
import { prisma } from '@/lib/prisma'
import { PDF_COLORS } from '@/lib/constants'
import { normalizeMedicine } from '@/lib/format'

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
}

const printer = new PdfPrinter(fonts)
const GRAY = PDF_COLORS.TEXT_SECONDARY
const LIGHT = PDF_COLORS.BG_STRIPE
const BLACK = PDF_COLORS.TEXT_PRIMARY

function buildMedicineInfoTable(med: {
  reference: string
  status: string | null
  atcCode: string | null
  prescriptionType: string | null
  pharmaceuticalForm: string | null
  concentration: string | null
  similarHolder: string | null
  presentationCount: number | null
  category: string | null
  authorization: string | null
  inclusionDate: string | null
  synonyms: string | null
  indications: string | null
}) {
  const infoRows: { label: string; value: string }[] = [
    { label: 'Referência', value: med.reference },
    { label: 'Situação', value: med.status === 'Ativo' || med.status === 'Inativo' ? `Registro ${med.status}` : med.status ?? '' },
  ]
  if (med.atcCode) infoRows.push({ label: 'Código ATC', value: med.atcCode })
  if (med.prescriptionType) infoRows.push({ label: 'Tarja', value: med.prescriptionType })
  if (med.pharmaceuticalForm) infoRows.push({ label: 'Forma Farmacêutica', value: med.pharmaceuticalForm })
  if (med.concentration) infoRows.push({ label: 'Concentração', value: med.concentration })
  if (med.similarHolder) infoRows.push({ label: 'Detentor', value: med.similarHolder })
  if (med.presentationCount) infoRows.push({ label: 'Apresentações', value: med.presentationCount.toString() })
  if (med.category) infoRows.push({ label: 'Categoria', value: med.category })
  if (med.authorization) infoRows.push({ label: 'Autorização', value: med.authorization })
  if (med.inclusionDate) infoRows.push({ label: 'Inclusão', value: med.inclusionDate })
  if (med.synonyms) infoRows.push({ label: 'Sinônimos', value: med.synonyms })
  if (med.indications) infoRows.push({ label: 'Indicações', value: med.indications })

  return infoRows.map(r => [
    { text: r.label, style: 'infoLabel' },
    { text: r.value, style: 'infoValue' },
  ])
}

function buildPriceTable(prices: { presentation: string; pf0Price: number | null; pf18Price: number | null }[]) {
  const priceHeader = [
    { text: 'Apresentação', style: 'tableHeader' },
    { text: 'PF0', style: 'tableHeader', alignment: 'right' as const },
    { text: 'PF18', style: 'tableHeader', alignment: 'right' as const },
  ]

  const priceBody = prices.map(p => [
    { text: p.presentation, style: 'cell' },
    { text: p.pf0Price ? `R$ ${p.pf0Price.toFixed(2)}` : '-', style: 'cell', alignment: 'right' as const },
    { text: p.pf18Price ? `R$ ${p.pf18Price.toFixed(2)}` : '-', style: 'cell', alignment: 'right' as const },
  ])

  return { priceHeader, priceBody }
}

function buildSimilarSection(similares: { tradeName: string; similarHolder: string | null; status: string | null }[], refName: string) {
  return [
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1, color: BLACK }], margin: [0, 0, 0, 10] },
    { text: `Similares de ${refName}`, fontSize: 12, bold: true, margin: [0, 0, 0, 8] },
    {
      ul: similares.map(s => ({
        text: `${s.tradeName} — ${s.similarHolder} (${s.status})`,
        fontSize: 9,
        margin: [0, 1, 0, 1],
      })),
      margin: [0, 0, 0, 14],
    },
  ]
}

function buildDocDefinition(
  med: {
    tradeName: string
    activeIngredient: string
    category: string | null
    referenceMedicine: string | null
    reference: string
    status: string | null
    atcCode: string | null
    prescriptionType: string | null
    pharmaceuticalForm: string | null
    concentration: string | null
    similarHolder: string | null
    presentationCount: number | null
    authorization: string | null
    inclusionDate: string | null
    synonyms: string | null
    indications: string | null
  },
  prices: { presentation: string; pf0Price: number | null; pf18Price: number | null }[],
  similares: { tradeName: string; similarHolder: string | null; status: string | null }[]
) {
  const infoTableBody = buildMedicineInfoTable(med)
  const { priceHeader, priceBody } = buildPriceTable(prices)

  const content: unknown[] = [
    { text: med.tradeName, fontSize: 22, bold: true, margin: [0, 0, 0, 4] },
    { text: med.activeIngredient, fontSize: 11, color: GRAY, margin: [0, 0, 0, 4] },
    med.category ? { text: med.category, fontSize: 9, color: GRAY, italics: true, margin: [0, 0, 0, 14] } : null,

    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1, color: BLACK }], margin: [0, 0, 0, 12] },

    { text: 'Informações do Medicamento', fontSize: 12, bold: true, margin: [0, 0, 0, 8] },

    {
      table: { widths: ['30%', '70%'], body: infoTableBody },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? LIGHT : null),
      },
      margin: [0, 0, 0, 14],
    },

    ...(med.referenceMedicine ? [
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1, color: BLACK }], margin: [0, 0, 0, 10] },
      { text: 'Medicamento de Referência', fontSize: 12, bold: true, margin: [0, 0, 0, 6] },
      { text: med.referenceMedicine, fontSize: 11, margin: [0, 0, 0, 14] },
    ] : []),

    ...(prices.length > 0 ? [
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1, color: BLACK }], margin: [0, 0, 0, 10] },
      { text: 'Preços CMED', fontSize: 12, bold: true, margin: [0, 0, 0, 8] },
      {
        table: { widths: ['*', 60, 60], headerRows: 1, body: [priceHeader, ...priceBody] },
        layout: {
          hLineWidth: (i: number) => (i === 0 || i === 1 ? 1 : 0.5),
          vLineWidth: () => 0.5,
          hLineColor: () => BLACK,
          vLineColor: () => BLACK,
          fillColor: (rowIndex: number) => (rowIndex === 0 ? BLACK : rowIndex % 2 === 0 ? LIGHT : null),
        },
        margin: [0, 0, 0, 10],
      },
    ] : []),

    ...(similares.length > 0 ? buildSimilarSection(similares, med.referenceMedicine || med.reference) : []),

    { text: 'Fonte: Dados Abertos ANVISA — dados.anvisa.gov.br', fontSize: 7, color: GRAY, margin: [0, 30, 0, 0] },
  ]

  return {
    pageSize: 'A4' as const,
    pageMargins: [50, 50, 50, 50],
    info: {
      title: `${med.tradeName} — Med Unificando`,
      author: 'Med Unificando',
      subject: 'Relatório de Medicamento',
    },
    header: () => ({
      margin: [50, 15, 50, 0],
      columns: [
        { text: 'Med Unificando', fontSize: 12, bold: true, width: '*', color: BLACK },
        { text: 'Relatório de Medicamento', fontSize: 7, color: GRAY, alignment: 'right', width: 'auto', margin: [0, 4, 0, 0] },
      ],
      columnGap: 10,
    }),
    footer: (currentPage: number, pageCount: number) => ({
      margin: [50, 10, 50, 10],
      columns: [
        { text: `Gerado em ${new Date().toLocaleString('pt-BR')}`, fontSize: 7, color: GRAY, alignment: 'left' },
        { text: `Página ${currentPage} de ${pageCount}`, fontSize: 7, color: GRAY, alignment: 'right' },
      ],
    }),
    content,
    styles: {
      tableHeader: {
        fontSize: 8,
        bold: true,
        color: '#ffffff',
        fillColor: BLACK,
        margin: [4, 4, 4, 4],
      },
      cell: {
        fontSize: 8,
        margin: [4, 4, 4, 4],
      },
      infoLabel: {
        fontSize: 8,
        bold: true,
        color: GRAY,
        margin: [4, 4, 4, 4],
      },
      infoValue: {
        fontSize: 10,
        margin: [4, 4, 4, 4],
      },
    },
    defaultStyle: {
      font: 'Helvetica',
      color: BLACK,
    },
  }
}

export async function generateMedicinePdf(id: number): Promise<number[]> {
  const med = await prisma.medicine.findUnique({ where: { id } })
  if (!med) throw new Error('Medicamento não encontrado')
  const normalizedMed = normalizeMedicine(med)

  const prices = await prisma.price.findMany({
    where: { reference: med.reference },
    take: 10,
    orderBy: { pf0Price: 'asc' },
  })

  const similares = med.referenceMedicine
    ? await prisma.medicine.findMany({
        where: { referenceMedicine: med.referenceMedicine, id: { not: med.id } },
        take: 10,
        orderBy: { tradeName: 'asc' },
        select: { tradeName: true, similarHolder: true, status: true },
      })
    : []

  const docDefinition = buildDocDefinition(normalizedMed, prices, similares)
  const pdfDoc = printer.createPdfKitDocument(docDefinition, {})

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk))
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)))
    pdfDoc.on('error', reject)
    pdfDoc.end()
  })

  return Array.from(buffer)
}
