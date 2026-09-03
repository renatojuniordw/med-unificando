'use server'

import { prisma } from '@/lib/prisma'
import { parseQuery } from '@/lib/query-parser'
import { GENERIC_TERMS } from '@/lib/dictionaries/synonyms'
import { buildOrTsQuery, expandTermsWithSynonyms } from '@/lib/keyword-utils'
import { stripAccents } from '@/lib/text-utils'
import { SEARCH } from '@/lib/config'

export async function keywordSearch(
  query: string,
  topK: number = SEARCH.HYBRID_TOP_K
): Promise<{ medicineId: number; keywordScore: number }[]> {
  if (!query.trim()) return []

  const parsed = parseQuery(query)
  const allTerms = [
    ...parsed.pharmaceuticalForms,
    ...parsed.therapeuticClasses,
    ...parsed.otherTerms,
  ].filter(term => !GENERIC_TERMS.has(stripAccents(term)))

  if (allTerms.length === 0) return []

  const expandedTerms = expandTermsWithSynonyms(allTerms)
  const searchQuery = buildOrTsQuery(expandedTerms)

  if (!searchQuery) return []

  const lang = SEARCH.TSQUERY_LANGUAGE
  const sql = `
    SELECT id, ts_rank("search_document", to_tsquery('${lang}', $1::text)) AS keyword_score
    FROM medicines
    WHERE "search_document" @@ to_tsquery('${lang}', $1::text)
    ORDER BY keyword_score DESC
    LIMIT $2
  `

  try {
    const rows = await prisma.$queryRawUnsafe<{ id: number; keyword_score: number }[]>(
      sql,
      searchQuery,
      topK,
    )

    return rows.map(r => ({
      medicineId: r.id,
      keywordScore: Number(r.keyword_score),
    }))
  } catch (error) {
    console.error(`[BUSCA DESCRIÇÃO] [Keyword] ❌ Erro ao executar busca FTS (tsquery: "${searchQuery}"):`, error)
    return []
  }
}
