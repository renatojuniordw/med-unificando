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
  
  // Novos sinônimos para condições clínicas comuns
  'articular':      ['articular', 'articulação', 'artrite', 'reumatismo', 'osteoartrite', 'doença articular'],
  'articulacao':    ['articulação', 'articular', 'artrite', 'reumatismo', 'osteoartrite'],
  'reumatismo':     ['reumatismo', 'artrite', 'reumatóide', 'doença autoimune'],
  'artrite':        ['artrite', 'inflamação articular', 'dor articular', 'reumatismo'],
  'renal':          ['renal', 'rim', 'insuficiência renal', 'doença renal'],
  'cardiaco':       ['cardíaco', 'coração', 'cardiovascular', 'insuficiência cardíaca'],
  'neurologico':    ['neurológico', 'sistema nervoso', 'neuropatia', 'doença neurológica'],
  'dermatologico':  ['dermatológico', 'pele', 'dermatite', 'eczema', 'psoríase'],
  'gastrointestinal': ['gastrointestinal', 'estômago', 'intestino', 'digestivo'],
  'respiratorio':   ['respiratório', 'pulmão', 'vias aéreas', 'brônquios'],
  'oftalmologico':  ['oftalmológico', 'olho', 'ocular', 'visão'],
  'urologico':      ['urológico', 'urinário', 'bexiga', 'próstata'],
  'psiquiatrico':   ['psiquiátrico', 'mental', 'psicológico', 'transtorno'],
  'oncologico':     ['oncológico', 'câncer', 'tumor', 'quimioterapia'],
  'pediatrico':     ['pediátrico', 'criança', 'infantil', 'bebê'],
  'geriatrico':     ['geriátrico', 'idoso', 'terceira idade', 'senhor'],
}

// Words that describe "this is a medicine" rather than what it treats. They
// match almost every row (e.g. via manufacturer names like "FUNDAÇÃO PARA O
// REMÉDIO POPULAR") without narrowing anything, so they're dropped before
// building the query instead of being treated as a real search term.
const GENERIC_TERMS = new Set([
  'remedio', 'remedios', 'medicamento', 'medicamentos', 'droga', 'drogas', 'farmaco', 'farmacos',
])

function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function expandWithSynonyms(terms: string[]): string[] {
  const expanded = new Set(terms)
  for (const term of terms) {
    const synonyms = SYNONYM_MAP[stripAccents(term)]
    if (synonyms) {
      for (const syn of synonyms) expanded.add(syn)
    }
  }
  return [...expanded]
}

function sanitizeWord(word: string): string {
  return word.replace(/['&|!()<>:*]/g, ' ').trim()
}

// Builds `to_tsquery` syntax where every (possibly multi-word) term/synonym is
// OR'd against the others. Using plainto_tsquery on the joined term list would
// AND every term together, so adding synonyms only narrowed matches instead of
// broadening them (e.g. a document would need to contain "dor" AND "cabeça"
// AND "analgesico" simultaneously).
function buildOrTsQuery(terms: string[]): string {
  const operands = terms
    .map(term => {
      const words = term.trim().split(/\s+/).map(sanitizeWord).filter(Boolean)
      if (words.length === 0) return ''
      return words.length === 1 ? words[0] : `(${words.join(' & ')})`
    })
    .filter(Boolean)
  return operands.join(' | ')
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
