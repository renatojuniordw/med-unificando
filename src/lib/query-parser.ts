export interface ParsedQuery {
  pharmaceuticalForms: string[]
  therapeuticClasses: string[]
  otherTerms: string[]
}

const PHARMACEUTICAL_FORM_TERMS = [
  'xarope', 'comprimido', 'cápsula', 'gotas', 'injetável',
  'solução', 'suspensão', 'pomada', 'creme', 'spray',
  'aerossol', 'adesivo', 'implante', 'elixir', 'granulado',
  'pó', 'supositório', 'óvulo', 'enema', 'colírio', 'xampu',
]

const THERAPEUTIC_CLASS_TERMS: string[] = [
  'antialérgico', 'anti-inflamatório', 'analgésico', 'antibiótico',
  'antiviral', 'antifúngico', 'antidepressivo', 'ansiolítico',
  'anticonvulsivante', 'anti-hipertensivo', 'diurético',
  'anticoagulante', 'antidiabético', 'antilipêmico',
  'antipsicótico', 'antiparkinsoniano', 'broncodilatador',
  'corticosteroide', 'imunossupressor', 'relaxante muscular',
  'vasoconstritor', 'vasodilatador',
]

export function parseQuery(query: string): ParsedQuery {
  if (!query.trim()) {
    return { pharmaceuticalForms: [], therapeuticClasses: [], otherTerms: [] }
  }

  const normalizedQuery = query.toLowerCase().trim()
  const terms: string[] = []
  
  // Primeiro, verificar se há frases compostas no mapa de sinônimos
  // (ex: "dor de cabeça" → tratar como uma unidade)
  const composedPhrases = [
    'dor de cabeça', 'dor-de-cabeca',
    'anti-inflamatório para articulação',
    'remédio para pressão',
    'remédio para diabetes',
    'remédio para alergia',
    'remédio para gripe',
    'remédio para tosse',
    'remédio para estômago',
    'remédio para azia',
    'remédio para ansiedade',
    'remédio para depressão',
    'remédio para infecção',
    'remédio para pele',
    'remédio para olho',
    'remédio para bexiga',
    'remédio para próstata',
  ]
  
  let remainingQuery = normalizedQuery
  
  for (const phrase of composedPhrases) {
    if (remainingQuery.includes(phrase)) {
      terms.push(phrase)
      remainingQuery = remainingQuery.replace(phrase, '').trim()
    }
  }
  
  // Se ainda há texto restante, separar em palavras
  if (remainingQuery) {
    const remainingTerms = remainingQuery.split(/\s+/).filter(Boolean)
    terms.push(...remainingTerms)
  }

  const pharmaceuticalForms: string[] = []
  const therapeuticClasses: string[] = []
  const otherTerms: string[] = []

  for (const term of terms) {
    if (PHARMACEUTICAL_FORM_TERMS.includes(term)) {
      pharmaceuticalForms.push(term)
    } else if (THERAPEUTIC_CLASS_TERMS.includes(term)) {
      therapeuticClasses.push(term)
    } else {
      otherTerms.push(term)
    }
  }

  return { pharmaceuticalForms, therapeuticClasses, otherTerms }
}
