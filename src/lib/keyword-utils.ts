// Funções de utilidade para construção de queries de busca textual
// Compartilhadas entre keyword-search e semantic-search

import { SYNONYM_MAP, COMPOUND_SUBJECTS, GENERIC_TERMS, PORTUGUESE_STOP_WORDS } from '@/lib/dictionaries/synonyms'
import { stripAccents } from '@/lib/text-utils'
import { parseQuery } from '@/lib/query-parser'

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

// Expansão canônica de termos com sinônimos — mesma lógica usada pela
// keywordSearch e pela verificação de suporte keyword no hybridSearch,
// para que a penalidade de "sem suporte" seja consistente com a própria busca.
export function expandTermsWithSynonyms(terms: string[]): string[] {
  const expanded = new Set(terms)

  // Frases compostas no mapa de sinônimos (ex: "dor de cabeça")
  const composedPhrases = ['dor-de-cabeca', 'dor de cabeça']

  for (const phrase of composedPhrases) {
    if (terms.some(t => t.toLowerCase().includes(phrase.toLowerCase()))) {
      const phraseKey = phrase in SYNONYM_MAP ? phrase :
        phrase.replace(/[\s-]+/g, '-') in SYNONYM_MAP ? phrase.replace(/[\s-]+/g, '-') :
        phrase.replace(/[\s-]+/g, ' ')
      const synonyms = SYNONYM_MAP[phraseKey]
      if (synonyms) {
        for (const syn of synonyms) expanded.add(syn)
      }
    }
  }

  for (const [subject, synonyms] of Object.entries(COMPOUND_SUBJECTS)) {
    if (terms.some(t => stripAccents(t).toLowerCase().includes(subject))) {
      for (const syn of synonyms) expanded.add(syn)
    }
  }

  // Expandir termos individuais (excluindo termos que fazem parte de frases compostas)
  const termsToExpand = terms.filter(term => {
    if (term.toLowerCase() === 'dor' && terms.some(t => t.toLowerCase().includes('cabeça'))) {
      return false
    }
    return true
  })

  for (const term of termsToExpand) {
    const synonyms = SYNONYM_MAP[stripAccents(term)]
    if (synonyms) {
      for (const syn of synonyms) expanded.add(syn)
    }
  }

  // Palavras individuais dentro de termos multi-palavra (ex: "remédio para estômago")
  for (const term of terms) {
    const words = term.split(/\s+/)
    if (words.length > 1) {
      for (const word of words) {
        const stripped = stripAccents(word.toLowerCase())
        const wordSynonyms = SYNONYM_MAP[stripped]
        if (wordSynonyms) {
          for (const syn of wordSynonyms) expanded.add(syn)
        }
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
  const cleanQuery = query.trim().toLowerCase()
  if (!cleanQuery || cleanQuery.length < 2) return null

  const parsed = parseQuery(query)
  const allTerms = [
    ...parsed.pharmaceuticalForms,
    ...parsed.therapeuticClasses,
    ...parsed.otherTerms,
  ].filter(term => !GENERIC_TERMS.has(stripAccents(term)))

  if (allTerms.length === 0) return null

  const expanded = expandTermsWithSynonyms(allTerms)
  if (expanded.length === 0) return null

  return buildOrTsQuery(expanded)
}
