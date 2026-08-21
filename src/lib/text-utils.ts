// Utilitários de texto compartilhados por search-preprocessor, query-parser,
// keyword-search, semantic-search e score-adjustments.

export function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/rem[eé]dio\s+para\s+/g, '')
    .replace(/medicamento\s+para\s+/g, '')
    .replace(/tomar\s+/g, '')
    .replace(/preciso\s+de\s+/g, '')
    .replace(/quero\s+/g, '')
    .replace(/buscar\s+/g, '')
    .replace(/procurar\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export const PHARMACEUTICAL_FORMS = new Set([
  'xarope', 'comprimido', 'cápsula', 'gotas', 'injetável',
  'solução', 'suspensão', 'pomada', 'creme', 'spray',
  'aerossol', 'adesivo', 'implante', 'elixir', 'granulado',
  'pó', 'supositório', 'óvulo', 'enema', 'colírio', 'xampu',
])

export const THERAPEUTIC_CLASSES = new Set([
  'antialérgico', 'anti-inflamatório', 'analgésico', 'antibiótico',
  'antiviral', 'antifúngico', 'antidepressivo', 'ansiolítico',
  'anticonvulsivante', 'anti-hipertensivo', 'diurético',
  'anticoagulante', 'antidiabético', 'antilipêmico',
  'antipsicótico', 'antiparkinsoniano', 'broncodilatador',
  'corticosteroide', 'imunossupressor', 'relaxante muscular',
  'vasoconstritor', 'vasodilatador',
])

// Versão como Array para query-parser (que usa includes())
export const PHARMACEUTICAL_FORM_TERMS = [...PHARMACEUTICAL_FORMS]
export const THERAPEUTIC_CLASS_TERMS = [...THERAPEUTIC_CLASSES]
