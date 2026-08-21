import { SYNONYM_MAP } from '@/lib/dictionaries/synonyms'
import { PHARMACEUTICAL_FORMS, THERAPEUTIC_CLASSES, stripAccents, normalizeQuery } from '@/lib/text-utils'

export interface QueryClassification {
  type: 'medicine-name' | 'condition' | 'therapeutic-class' | 'mixed'
  confidence: number
  medicineNameCandidate?: string
  conditionTerms?: string[]
}

const CONDITION_KEYWORDS = new Set([
  ...Object.keys(SYNONYM_MAP),
  'remédio para', 'remedio para', 'medicamento para',
  'tratar', 'tratamento', 'aliviar', 'alívio',
])

const FILLER_WORDS = new Set([
  'tomar', 'preciso', 'quero', 'buscar', 'procurar', 'acho',
  'qual', 'quais', 'me', 'dá', 'passa', 'indica',
])

function hasConditionKeyword(words: string[]): boolean {
  const normalized = words.map(w => stripAccents(w))
  return normalized.some(w => CONDITION_KEYWORDS.has(w))
}

function hasPharmaceuticalForm(words: string[]): boolean {
  return words.some(w => PHARMACEUTICAL_FORMS.has(w))
}

function hasTherapeuticClass(words: string[]): boolean {
  return words.some(w => THERAPEUTIC_CLASSES.has(w))
}

function looksLikeMedicineName(query: string, words: string[]): boolean {
  // Single word that doesn't match any known category patterns
  if (words.length > 3) return false
  if (hasConditionKeyword(words)) return false
  if (hasPharmaceuticalForm(words)) return false
  if (hasTherapeuticClass(words)) return false

  // Common medicine name suffixes (Portuguese/generic pharmaceutical)
  const medicineSuffixes = [
    'lina', 'zepam', 'prazol', 'profeno', 'navir', 'micina',
    'laxol', 'dina', 'pina', 'zolam', 'olol', 'sartan',
    'statin', 'oxacin', 'ciclina', 'mab', 'nib', 'zumab',
  ]
  const stripped = stripAccents(query)
  if (medicineSuffixes.some(s => stripped.endsWith(s))) return true

  // Known active ingredients in SYNONYM_MAP values
  const allValues = Object.values(SYNONYM_MAP).flat()
  const strippedValues = allValues.map(v => stripAccents(v))
  if (strippedValues.includes(stripped)) return false // it's a known condition synonym

  // Short query (1-2 words) without condition markers → likely medicine name
  if (words.length <= 2) return true

  return false
}

export function classifyQuery(query: string): QueryClassification {
  const normalized = normalizeQuery(query)
  const words = normalized.split(/\s+/).filter(w => w.length > 0)

  if (words.length === 0) {
    return { type: 'condition', confidence: 0 }
  }

  // Check for explicit condition queries ("remédio para X")
  const originalLower = query.toLowerCase()
  if (originalLower.includes('remédio para') || originalLower.includes('remedio para') ||
      originalLower.includes('medicamento para')) {
    return {
      type: 'condition',
      confidence: 0.9,
      conditionTerms: words,
    }
  }

  // Check pharmaceutical forms and therapeutic classes
  const isPharmaForm = hasPharmaceuticalForm(words)
  const isTherClass = hasTherapeuticClass(words)
  const isCondition = hasConditionKeyword(words)

  const categories = [isPharmaForm, isTherClass, isCondition].filter(Boolean).length

  if (categories >= 2) {
    return { type: 'mixed', confidence: 0.7, conditionTerms: words }
  }

  if (isTherClass) {
    return { type: 'therapeutic-class', confidence: 0.8, conditionTerms: words }
  }

  if (isCondition) {
    return { type: 'condition', confidence: 0.85, conditionTerms: words }
  }

  if (isPharmaForm) {
    return { type: 'condition', confidence: 0.6, conditionTerms: words }
  }

  // No known category patterns → likely medicine name
  if (looksLikeMedicineName(normalized, words)) {
    return {
      type: 'medicine-name',
      confidence: 0.75,
      medicineNameCandidate: normalized,
    }
  }

  return { type: 'condition', confidence: 0.4, conditionTerms: words }
}
