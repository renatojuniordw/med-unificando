declare module 'pdfmake' {
  class PdfPrinter {
    constructor(fonts: Record<string, { normal: string; bold?: string; italics?: string; bolditalics?: string }>)
    createPdfKitDocument(docDefinition: Record<string, unknown>, options?: Record<string, unknown>): import('stream').Duplex
  }
  export default PdfPrinter
}

declare module 'pdfmake/interfaces' {
  export interface TDocumentDefinitions { [key: string]: unknown }
  export interface BufferOptions { [key: string]: unknown }
  export interface TFontDictionary { [key: string]: { normal: string; bold?: string; italics?: string; bolditalics?: string } }
}
