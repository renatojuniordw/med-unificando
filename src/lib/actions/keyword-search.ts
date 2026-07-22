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
  estomago:    ['estomago', 'estômago', 'gastrico', 'gástrico', 'antiacido', 'antiácido', 'protetor gastrico', 'protetor gástrico', 'azia', 'refluxo', 'gastrite', 'ulcera', 'úlcera', 'dispepsia', 'digestao', 'digestão', 'omeprazol', 'pantoprazol', 'esomeprazol'],
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
  
  // Também mapear "remédio para X" para o sinônimo de X
  // Ex: "remédio para estômago" usa sinônimos de "estomago"
  const compoundSubjects: Record<string, string[]> = {
    'estomago': ['estômago', 'gastrico', 'gástrico', 'antiacido', 'antiácido', 'protetor gastrico', 'protetor gástrico', 'azia', 'refluxo', 'gastrite', 'ulcera', 'úlcera', 'dispepsia', 'digestao', 'digestão', 'omeprazol', 'pantoprazol', 'esomeprazol'],
    'gastrite': ['gastrite', 'estômago', 'gastrico', 'gástrico', 'antiacido', 'antiácido', 'azia', 'refluxo', 'ulcera', 'úlcera', 'protetor gastrico', 'protetor gástrico'],
    'articulacao': ['articulação', 'articular', 'artrite', 'reumatismo', 'osteoartrite', 'doença articular', 'anti-inflamatorio', 'anti-inflamatório'],
    'cabeça': ['cabeça', 'cefaleia', 'migrânea', 'migranea', 'dor de cabeça', 'dor-de-cabeca', 'analgesico', 'analgésico', 'anti-inflamatorio', 'anti-inflamatório'],
    'cefaleia': ['cefaleia', 'dor de cabeça', 'dor-de-cabeca', 'migrânea', 'migranea', 'analgesico', 'analgésico', 'anti-inflamatorio', 'anti-inflamatório'],
    'gripe': ['gripe', 'resfriado', 'congestao', 'nariz', 'tosse', 'febre', 'antitérmico'],
    'pele': ['pele', 'dermatologico', 'dermatológico', 'dermatite', 'eczema', 'psoríase', 'creme', 'pomada'],
  }
  
  for (const [subject, synonyms] of Object.entries(compoundSubjects)) {
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

function sanitizeWord(word: string): string {
  return word.replace(/['&|!()<>:*]/g, ' ').trim()
}

// Stop words para evitar queries vazias ou incorretas no to_tsquery do PostgreSQL
const PORTUGUESE_STOP_WORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
  'para', 'pra', 'pro', 'por', 'com', 'sem', 'sob', 'sobre',
  'a', 'as', 'o', 'os', 'um', 'uma', 'uns', 'umas',
  'e', 'ou', 'mas', 'que', 'se', 'como', 'mais', 'menos',
  'ao', 'aos', 'à', 'às', 'pelo', 'pela', 'pelos', 'pelas',
  'num', 'numa', 'dum', 'duma', 'duns', 'dumas',
  'ele', 'ela', 'eles', 'elas', 'meu', 'minha', 'teu', 'tua',
  'seu', 'sua', 'nosso', 'nossa', 'vosso', 'vossa',
  'eu', 'tu', 'ele', 'nós', 'vós', 'eles', 'me', 'te', 'lhe',
  'nos', 'vos', 'lhes', 'minha', 'tua', 'sua', 'nossa', 'vossa',
  'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas',
  'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'isso', 'aquilo',
  'já', 'ainda', 'bem', 'mal', 'sim', 'não', 'nunca', 'sempre',
  'muito', 'pouco', 'tanto', 'quanto', 'todo', 'toda', 'todos', 'todas',
  'outro', 'outra', 'outros', 'outras', 'cada', 'certo', 'algum', 'alguma',
  'nenhum', 'nenhuma', 'qualquer', 'quaisquer',
])

// Builds `to_tsquery` syntax where every (possibly multi-word) term/synonym is
// OR'd against the others. Using plainto_tsquery on the joined term list would
// AND every term together, so adding synonyms only narrowed matches instead of
// broadening them (e.g. a document would need to contain "dor" AND "cabeça"
// AND "analgesico" simultaneously).
function buildOrTsQuery(terms: string[]): string {
  const operands = terms
    .map(term => {
      const words = term.trim().split(/\s+/).map(sanitizeWord).filter(Boolean)
        .filter(w => !PORTUGUESE_STOP_WORDS.has(w.toLowerCase()))
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
