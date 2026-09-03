import https from 'https'
import iconv from 'iconv-lite'
import * as XLSX from 'xlsx'
import { anvisaAgent } from '@/lib/anvisa-https'

export function downloadCsv(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { agent: anvisaAgent }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => resolve(iconv.decode(Buffer.concat(chunks), 'latin1')))
      res.on('error', reject)
    }).on('error', reject)
  })
}

// xlsx@0.18.5 has known vulnerabilities (prototype pollution, ReDoS).
// Risk is mitigated because: 1) CSV comes from ANVISA (trusted source), 2) not user-uploaded.
// TODO: Replace xlsx with a safer CSV parser when fix becomes available.
export function parseCsvToRows(csvText: string): Record<string, string>[] {
  const sanitized = csvText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  const workbook = XLSX.read(sanitized, { type: 'string', raw: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet, { defval: '' })
}
