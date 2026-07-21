'use server'

import { prisma } from '@/lib/prisma'
import { parseQuery } from '@/lib/query-parser'

const SYNONYM_MAP: Record<string, string[]> = {
  pressao:     ['pressao', 'pressão', 'hipertensao', 'hipertensão', 'anti-hipertensivo', 'anti-hipertensão'],
  alergia:     ['alergia', 'alergico', 'alérgico', 'antialergico', 'antialérgico', 'anti-histaminico', 'anti-histamínico'],
  dor:         ['dor', 'analgesico', 'analgésico', 'anti-inflamatorio', 'anti-inflamatório'],
  diabetes:    ['diabetes', 'antidiabetico', 'antidiabético', 'metformina', 'insulina'],
  febre:       ['febre', 'antitermico', 'antitérmico', 'antipiretico', 'antipirético'],
  inflamacao:  ['inflamacao', 'inflamação', 'anti-inflamatorio', 'anti-inflamatório', 'antiinflamatorio'],
  infeccao:    ['infeccao', 'infecção', 'antibiotico', 'antibiótico', 'antimicrobiano'],
  colesterol:  ['colesterol', 'antilipemico', 'antilipêmico', 'sinvastatina', 'estatina'],
  ansiedade:   ['ansiedade', 'ansiolitico', 'ansiolítico', 'calmante', 'benzodiazepinico'],
  depressao:   ['depressao', 'depressão', 'antidepressivo'],
  tosse:       ['tosse', 'antitussigeno', 'antitussígeno', 'expectorante'],
  estomago:    ['estomago', 'estômago', 'gastrico', 'gástrico', 'antiacido', 'antiácido'],
  uc:          ['uc', 'ulcera', 'úlcera', 'gastrico', 'gástrico', 'protonico', 'protetor gástrico'],
  asma:        ['asma', 'broncodilatador', 'bronquite'],
  insulina:    ['insulina', 'antidiabetico', 'antidiabético', 'diabetes'],
  'dor-de-cabeca': ['dor-de-cabeca', 'dor de cabeça', 'cefaleia', 'migrânea', 'migranea'],
}

function expandWithSynonyms(terms: string[]): string[] {
  const expanded = new Set(terms)
  for (const term of terms) {
    const synonyms = SYNONYM_MAP[term]
    if (synonyms) {
      for (const syn of synonyms) expanded.add(syn)
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
  ]

  if (allTerms.length === 0) return []

  const expandedTerms = expandWithSynonyms(allTerms)
  const searchQuery = expandedTerms.join(' ')

  const sql = `
    SELECT id, ts_rank("search_document", plainto_tsquery('portuguese', $1::text)) AS keyword_score
    FROM medicines
    WHERE "search_document" @@ plainto_tsquery('portuguese', $1::text)
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
