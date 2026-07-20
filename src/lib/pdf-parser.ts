import pdf from 'pdf-parse'

const formPatterns = [
  'pó liof sol inj', 'sol spr nas', 'cap dura', 'com lib prol',
  'com efev', 'com rev', 'sol or', 'gel or', 'crem derm',
  'ades transd', 'sol dilu', 'pó sol or', 'com subl',
  'sol spray', 'sol got', 'cap mole', 'sus or', 'pó sus',
  'sol oft', 'pom oft', 'sol inj', 'sol derm', 'sol tóp',
  'sol dil', 'pó liof', 'shampoo', 'gran', 'xpe', 'aer',
  'loção', 'pom', 'gel', 'liq', 'cap', 'liof', 'crem',
  'ades', 'enema', 'impl', 'past', 'sup', 'xar', 'com',
]

formPatterns.sort((a, b) => b.length - a.length)

export interface ParsedMedicine {
  reference: string
  activeIngredient: string
  tradeName: string
  similarHolder: string
  pharmaceuticalForm: string
  concentration: string
  inclusionDate: string
}

function parseMedicineLine(line: string): ParsedMedicine | null {
  const regMatch = line.match(/(\d{9})/)
  if (!regMatch) return null

  const regIndex = regMatch.index!
  const regNum = regMatch[1]
  const beforeReg = line.substring(0, regIndex)
  const afterReg = line.substring(regIndex + 9)

  const dateMatch = afterReg.match(/(\d{2}\/\d{2}\/\d{4})$/)
  const inclusionDate = dateMatch ? dateMatch[1] : ''
  const afterWithoutDate = afterReg
    .substring(0, afterReg.length - inclusionDate.length)
    .trim()

  let pharmaceuticalForm = ''
  let concentration = afterWithoutDate

  for (const form of formPatterns) {
    const fi = concentration.indexOf(form)
    if (fi >= 0) {
      pharmaceuticalForm = concentration.substring(fi).trim()
      concentration = concentration.substring(0, fi).trim()
      break
    }
  }

  const tradeMatch = beforeReg.match(/([A-Z][A-ZÀ-Ú0-9\s-]+)$/)
  const tradeName = tradeMatch ? tradeMatch[1].trim() : ''
  const beforeTrade = tradeMatch
    ? beforeReg.substring(0, tradeMatch.index).trim()
    : beforeReg

  const holderMatch = beforeTrade.match(/^(.+?)([A-Z][a-zà-ú][A-Za-zà-ú\s-]*)$/)
  let activeIngredient = beforeTrade
  let similarHolder = ''

  if (holderMatch) {
    activeIngredient = holderMatch[1].trim()
    similarHolder = holderMatch[2].trim()
  }

  return {
    reference: regNum,
    activeIngredient,
    tradeName,
    similarHolder,
    pharmaceuticalForm,
    concentration,
    inclusionDate,
  }
}

export async function parseMedicinePDF(buffer: Buffer): Promise<ParsedMedicine[]> {
  const data = await pdf(buffer)
  const lines = data.text.split('\n').filter((l: string) => l.trim())

  const results: ParsedMedicine[] = []

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].startsWith('FÁRMACO')) continue
    const parsed = parseMedicineLine(lines[i])
    if (parsed && parsed.activeIngredient) {
      results.push(parsed)
    }
  }

  return results
}
