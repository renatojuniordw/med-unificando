'use server'

import { prisma } from '@/lib/prisma'
import { parseQuery } from '@/lib/query-parser'
import { SYNONYM_MAP, GENERIC_TERMS, COMPOUND_SUBJECTS } from '@/lib/dictionaries/synonyms'
import { buildOrTsQuery } from '@/lib/keyword-utils'
import { stripAccents } from '@/lib/text-utils'

function expandWithSynonyms(terms: string[]): string[] {
  const expanded = new Set(terms)
  
  // Primeiro, verificar se há frases compostas no mapa de sinônimos
  // (ex: "dor de cabeça" → usar sinônimo específico em vez de expandir "dor" separadamente)
  const composedPhrases = ['dor-de-cabeca', 'dor de cabeça']
  
  for (const phrase of composedPhrases) {
    // Se a frase composta está nos termos originais, usar seus sinônimos
    if (terms.some(t => t.toLowerCase().includes(phrase.toLowerCase()))) {
      // Tentar lookup tanto com a chave original quanto normalizada
      // (ex: "dor de cabeça" com espaço deve buscar SYNONYM_MAP["dor-de-cabeca"])
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
  
  // Depois, expandir termos individuais (mas excluindo termos que fazem parte de frases compostas)
  const termsToExpand = terms.filter(term => {
    // Não expandir "dor" se "cabeça" também está presente (já tratado acima)
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

  // Também expandir palavras individuais dentro de termos multi-palavra
  // (ex: "remédio para estômago" → expandir "estômago" individualmente)
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

export async function keywordSearch(
  query: string,
  topK: number = 20
): Promise<{ medicineId: number; keywordScore: number }[]> {
  if (!query.trim()) return []

  const parsed = parseQuery(query)
  const allTerms = [
    ...parsed.pharmaceuticalForms,
    ...parsed.therapeuticClasses,
    ...parsed.otherTerms,
  ].filter(term => !GENERIC_TERMS.has(stripAccents(term)))

  if (allTerms.length === 0) return []

  const expandedTerms = expandWithSynonyms(allTerms)
  const searchQuery = buildOrTsQuery(expandedTerms)

  if (!searchQuery) return []

  const sql = `
    SELECT id, ts_rank("search_document", to_tsquery('portuguese', $1::text)) AS keyword_score
    FROM medicines
    WHERE "search_document" @@ to_tsquery('portuguese', $1::text)
    ORDER BY keyword_score DESC
    LIMIT $2
  `

  const rows = await prisma.$queryRawUnsafe<{ id: number; keyword_score: number }[]>(
    sql,
    searchQuery,
    topK,
  )

  return rows.map(r => ({
    medicineId: r.id,
    keywordScore: Number(r.keyword_score),
  }))
}
