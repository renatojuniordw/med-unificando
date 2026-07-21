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

  const terms = query.toLowerCase().split(/\s+/)
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
