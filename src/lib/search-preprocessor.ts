import { SYNONYM_MAP } from '@/lib/dictionaries/synonyms'

export interface QueryClassification {
  type: 'medicine-name' | 'condition' | 'therapeutic-class' | 'mixed'
  confidence: number
  medicineNameCandidate?: string
  conditionTerms?: string[]
}

const PHARMACEUTICAL_FORMS = new Set([
  'xarope', 'comprimido', 'cápsula', 'gotas', 'injetável',
  'solução', 'suspensão', 'pomada', 'creme', 'spray',
  'aerossol', 'adesivo', 'implante', 'elixir', 'granulado',
  'pó', 'supositório', 'óvulo', 'enema', 'colírio', 'xampu',
])

const THERAPEUTIC_CLASSES = new Set([
  'antialérgico', 'anti-inflamatório', 'analgésico', 'antibiótico',
  'antiviral', 'antifúngico', 'antidepressivo', 'ansiolítico',
  'anticonvulsivante', 'anti-hipertensivo', 'diurético',
  'anticoagulante', 'antidiabético', 'antilipêmico',
  'antipsicótico', 'antiparkinsoniano', 'broncodilatador',
  'corticosteroide', 'imunossupressor', 'relaxante muscular',
  'vasoconstritor', 'vasodilatador',
])

const CONDITION_KEYWORDS = new Set([
  ...Object.keys(SYNONYM_MAP),
  'remédio para', 'remedio para', 'medicamento para',
  'tratar', 'tratamento', 'aliviar', 'alívio',
])

const FILLER_WORDS = new Set([
  'tomar', 'preciso', 'quero', 'buscar', 'procurar', 'acho',
  'qual', 'quais', 'me', 'dá', 'passa', 'indica',
])

function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/rem[eé]dio\s+para\s+/g, '')
    .replace(/medicamento\s+para\s+/g, '')
    .replace(/tomar\s+/g, '')
    .replace(/preciso\s+de\s+/g, '')
    .replace(/quero\s+/g, '')
    .replace(/buscar\s+/g, '')
    .replace(/procurar\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

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

export function normalizeMedicalTerms(query: string): string {
  const normalized = normalizeQuery(query)
  // Remove filler words
  const words = normalized.split(/\s+/)
  const cleaned = words.filter(w => !FILLER_WORDS.has(stripAccents(w)))
  return cleaned.join(' ')
}
