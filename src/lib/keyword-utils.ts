// Funções de utilidade para construção de queries de busca textual
// Compartilhadas entre keyword-search e semantic-search

import { SYNONYM_MAP, COMPOUND_SUBJECTS, PORTUGUESE_STOP_WORDS } from '@/lib/dictionaries/synonyms'

export function getSynonymExpansion(query: string): string[] {
  const q = query.toLowerCase().trim()
  const expanded = new Set<string>([
    q.replace(/rem[eé]dio\s+para\s+/g, '').trim(),
  ])

  // Check compound subjects
  for (const [subject, synonyms] of Object.entries(COMPOUND_SUBJECTS)) {
    if (q.includes(subject)) {
      for (const syn of synonyms) expanded.add(syn)
    }
  }

  // Check the stripped version against SYNONYM_MAP
  const stripped = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const syns = SYNONYM_MAP[stripped]
  if (syns) {
    for (const syn of syns) expanded.add(syn)
  }

  // Also try individual words
  for (const word of q.split(/\s+/)) {
    const wordStripped = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (wordStripped.length > 2 && wordStripped !== stripped) {
      const wordSyns = SYNONYM_MAP[wordStripped]
      if (wordSyns) {
        for (const syn of wordSyns) expanded.add(syn)
      }
    }
  }

  return [...expanded]
}

export function buildOrTsQuery(terms: string[]): string {
  function sanitizeWord(word: string): string {
    return word.replace(/['&|!()<>:*]/g, ' ').trim()
  }

  const operands = terms
    .map(term => {
      const words = term.trim().split(/\s+/).map(sanitizeWord).filter(Boolean)
        .filter(w => !PORTUGUESE_STOP_WORDS.has(w.toLowerCase()))
      if (words.length === 0) return ''
      if (words.length === 1) return words[0]
      return `(${words.join(' & ')})`
    })
    .filter(Boolean)
  return operands.join(' | ')
}

export function buildExpandedTsquery(query: string): string | null {
  const cleanQuery = query.toLowerCase()
    .replace(/rem[eé]dio\s+para\s+/g, '')
    .replace(/medicamento\s+para\s+/g, '')
    .trim()

  if (!cleanQuery || cleanQuery.length < 2) return null

  const expanded = getSynonymExpansion(cleanQuery)
  if (expanded.length === 0) return null

  return buildOrTsQuery(expanded)
}
