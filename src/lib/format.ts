const STOP_WORDS = new Set([
  'de', 'da', 'do', 'das', 'dos',
  'e', 'em', 'com', 'para', 'por',
  'sem', 'sob', 'a', 'o', 'as', 'os',
  'no', 'na', 'nos', 'nas', 'um', 'uma'
])

export function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word, i) =>
      i === 0 || !STOP_WORDS.has(word)
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word
    )
    .join(' ')
}

const NORMALIZABLE_FIELDS = [
  'activeIngredient', 'tradeName', 'similarHolder',
  'pharmaceuticalForm', 'category', 'referenceMedicine',
  'synonyms', 'indications', 'therapeuticClass', 'prescriptionType'
]

export function normalizeMedicine<T>(m: T): T {
  const out = { ...m } as Record<string, unknown>
  for (const key of NORMALIZABLE_FIELDS) {
    const value = out[key]
    if (typeof value === 'string' && value.length > 0) {
      out[key] = normalizeText(value)
    }
  }
  return out as T
}
