'use server'

import { prisma } from '@/lib/prisma'
import { parseQuery } from '@/lib/query-parser'

const FIELD_WEIGHTS: Record<string, number> = {
  pharmaceuticalForm: 2.0,
  therapeuticClass: 1.5,
  activeIngredient: 1.0,
  tradeName: 1.0,
  indications: 1.0,
}

const SEARCH_FIELDS = [
  'pharmaceuticalForm',
  'therapeuticClass',
  'activeIngredient',
  'tradeName',
  'indications',
] as const

export async function keywordSearch(
  query: string,
  topK: number = 20
): Promise<{ medicineId: number; keywordScore: number }[]> {
  if (!query.trim()) return []

  const parsed = parseQuery(query)
  const allTerms = [
    ...parsed.pharmaceuticalForms.map(t => ({ term: t, boost: 2.0 })),
    ...parsed.therapeuticClasses.map(t => ({ term: t, boost: 1.5 })),
    ...parsed.otherTerms.map(t => ({ term: t, boost: 1.0 })),
  ]

  if (allTerms.length === 0) return []

  const conditions = allTerms.flatMap(({ term, boost }) =>
    SEARCH_FIELDS.map(field => ({
      field,
      term,
      weight: FIELD_WEIGHTS[field] * boost,
    }))
  )

  const scoreParts = conditions.map(
    (c, i) => `COALESCE(similarity(m.${c.field}::text, ${'$' + (i + 1)}::text), 0) * ${c.weight}`
  )

  const sql = `
    SELECT m.id, (${scoreParts.join(' + ')}) / ${conditions.reduce((s, c) => s + c.weight, 0)} AS keyword_score
    FROM medicines m
    WHERE ${conditions.map((c, i) => `m.${c.field}::text % ${'$' + (i + 1)}::text`).join(' OR ')}
    ORDER BY keyword_score DESC
    LIMIT ${topK}
  `

  const params = conditions.flatMap(c => [c.term])

  const rows = await prisma.$queryRawUnsafe<{ id: number; keyword_score: number }[]>(sql, ...params)

  return rows.map(r => ({
    medicineId: r.id,
    keywordScore: Number(r.keyword_score),
  }))
}
