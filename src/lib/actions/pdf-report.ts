'use server'

import PdfPrinter from 'pdfmake'
import { prisma } from '@/lib/prisma'

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
}

const printer = new PdfPrinter(fonts)

export async function generateMedicinePdf(id: number): Promise<Buffer> {
  const med = await prisma.medicine.findUnique({ where: { id } })
  if (!med) throw new Error('Medicamento não encontrado')

  const prices = await prisma.price.findMany({
    where: { reference: med.reference },
    take: 10,
    orderBy: { pf0Price: 'asc' },
  })

  const body = [
    ['Referência', med.reference],
    ['Situação', med.status === 'Ativo' || med.status === 'Inativo' ? `Registro ${med.status}` : med.status],
  ]
  if (med.atcCode) body.push(['Código ATC', med.atcCode])
  if (med.prescriptionType) body.push(['Tarja', med.prescriptionType])
  if (med.pharmaceuticalForm) body.push(['Forma Farmacêutica', med.pharmaceuticalForm])
  if (med.concentration) body.push(['Concentração', med.concentration])
  if (med.similarHolder) body.push(['Detentor', med.similarHolder])
  if (med.presentationCount) body.push(['Apresentações', med.presentationCount.toString()])
  if (med.category) body.push(['Categoria', med.category])
  if (med.authorization) body.push(['Autorização', med.authorization])
  if (med.synonyms) body.push(['Sinônimos', med.synonyms])
  if (med.indications) body.push(['Indicações', med.indications])

  const priceRows = prices.map(p => [
    { text: p.presentation, style: 'cell' },
    { text: p.pf0Price ? `R$ ${p.pf0Price.toFixed(2)}` : '-', style: 'cell', alignment: 'right' as const },
    { text: p.pf18Price ? `R$ ${p.pf18Price.toFixed(2)}` : '-', style: 'cell', alignment: 'right' as const },
  ])

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [50, 50, 50, 50],
    info: {
      title: `${med.tradeName} — Unificando Med`,
      author: 'Unificando Med',
      subject: 'Relatório de Medicamento',
    },
    header: () => ({
      margin: [50, 15, 50, 0],
      columns: [
        { text: 'U', color: '#ccff00', fontSize: 22, bold: true, width: 30 },
        { text: 'UNIFICANDO MED', color: '#ffffff', fontSize: 14, bold: true, width: 200 },
        { text: 'RELATÓRIO DE MEDICAMENTO', color: '#ccff00', fontSize: 7, alignment: 'right', width: '*', margin: [0, 6, 0, 0] },
      ],
      background: () => ({ canvas: [{ type: 'rect', x: 0, y: 0, w: 595, h: 50, color: '#020617' }] }),
    }),
    footer: (currentPage: number, pageCount: number) => ({
      margin: [50, 10, 50, 10],
      columns: [
        { text: `Relatório gerado em ${new Date().toLocaleString('pt-BR')}`, fontSize: 7, color: '#64748b', width: '*', alignment: 'left' },
        { text: `Página ${currentPage} de ${pageCount}`, fontSize: 7, color: '#64748b', alignment: 'right' },
      ],
    }),
    content: [
      { text: med.tradeName, fontSize: 20, bold: true, margin: [0, 20, 0, 4] },
      { text: med.activeIngredient, fontSize: 11, color: '#64748b', margin: [0, 0, 0, 6] },
      med.category ? { text: med.category.toUpperCase(), color: '#ccff00', background: '#020617', fontSize: 8, bold: true, margin: [0, 0, 0, 10], fillColor: '#020617' } : null,

      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 2 }] },

      { text: 'INFORMAÇÕES DO MEDICAMENTO', margin: [0, 14, 0, 8], fontSize: 9, bold: true, color: '#ccff00', background: '#020617', fillColor: '#020617' },

      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: body.map(row => [
            { text: (row[0] as string).toUpperCase(), fontSize: 7, color: '#64748b', bold: true },
            { text: row[1] as string, fontSize: 10, bold: true },
            { text: '', fontSize: 7 },
            { text: '', fontSize: 7 },
          ]),
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 10],
      },

      ...(med.referenceMedicine ? [
        { text: 'MEDICAMENTO DE REFERÊNCIA', margin: [0, 10, 0, 6], fontSize: 9, bold: true, color: '#ccff00', background: '#020617', fillColor: '#020617' },
        { text: med.referenceMedicine, fontSize: 11, bold: true, margin: [0, 0, 0, 10] },
      ] : []),

      ...(prices.length > 0 ? [
        { text: 'PREÇOS CMED', margin: [0, 10, 0, 6], fontSize: 9, bold: true, color: '#ccff00', background: '#020617', fillColor: '#020617' },
        {
          table: {
            widths: ['*', 'auto', 'auto'],
            headerRows: 1,
            body: [
              [
                { text: 'APRESENTAÇÃO', style: 'tableHeader' },
                { text: 'PF0', style: 'tableHeader', alignment: 'right' },
                { text: 'PF18', style: 'tableHeader', alignment: 'right' },
              ],
              ...priceRows,
            ],
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#020617',
            vLineColor: () => '#020617',
          },
          margin: [0, 0, 0, 10],
        },
      ] : []),

      { text: 'Fonte: Dados Abertos ANVISA — dados.anvisa.gov.br', fontSize: 7, color: '#64748b', margin: [0, 20, 0, 0] },
    ],
    styles: {
      tableHeader: {
        fontSize: 7,
        bold: true,
        color: '#ccff00',
        fillColor: '#020617',
        margin: [4, 4, 4, 4],
      },
      cell: {
        fontSize: 8,
        margin: [4, 4, 4, 4],
      },
    },
    defaultStyle: {
      font: 'Helvetica',
    },
  }

  const options = {}
  const pdfDoc = printer.createPdfKitDocument(docDefinition, options)

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk))
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)))
    pdfDoc.on('error', reject)
    pdfDoc.end()
  })
}
