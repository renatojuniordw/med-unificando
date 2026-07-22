// Funções de utilidade para construção de queries de busca textual
// Compartilhadas entre keyword-search e semantic-search

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
  asma:        ['asma', 'broncodilatador', 'bronquite'],
  insulina:    ['insulina', 'antidiabetico', 'antidiabético', 'diabetes'],
  'dor-de-cabeca': ['dor-de-cabeca', 'dor de cabeça', 'cefaleia', 'migrânea', 'migranea'],
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
}

const COMPOUND_SUBJECTS: Record<string, string[]> = {
  'estomago': ['estômago', 'gastrico', 'gástrico', 'antiacido', 'antiácido', 'protetor gastrico', 'protetor gástrico', 'azia', 'refluxo', 'gastrite', 'ulcera', 'úlcera', 'dispepsia', 'digestao', 'digestão', 'omeprazol', 'pantoprazol', 'esomeprazol'],
  'gastrite': ['gastrite', 'estômago', 'gastrico', 'gástrico', 'antiacido', 'antiácido', 'azia', 'refluxo', 'ulcera', 'úlcera', 'protetor gastrico', 'protetor gástrico'],
  'cabeça': ['cabeça', 'cefaleia', 'migrânea', 'migranea', 'dor de cabeça', 'dor-de-cabeca', 'analgesico', 'analgésico', 'anti-inflamatorio', 'anti-inflamatório'],
  'cefaleia': ['cefaleia', 'dor de cabeça', 'dor-de-cabeca', 'migrânea', 'migranea', 'analgesico', 'analgésico', 'anti-inflamatorio', 'anti-inflamatório'],
  'gripe': ['gripe', 'resfriado', 'congestao', 'nariz', 'tosse', 'febre', 'antitérmico'],
  'pele': ['pele', 'dermatologico', 'dermatológico', 'dermatite', 'eczema', 'psoríase', 'creme', 'pomada'],
}

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

export function buildOrTsQuery(terms: string[]): string {
  const PORTUGUESE_STOP_WORDS = new Set([
    'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
    'para', 'pra', 'pro', 'por', 'com', 'sem', 'sob', 'sobre',
    'a', 'as', 'o', 'os', 'um', 'uma', 'uns', 'umas',
    'e', 'ou', 'mas', 'que', 'se', 'como', 'mais', 'menos',
  ])

  function sanitizeWord(word: string): string {
    return word.replace(/['&|!()<>:*]/g, ' ').trim()
  }

  const operands = terms
    .map(term => {
      const words = term.trim().split(/\s+/).map(sanitizeWord).filter(Boolean)
        .filter(w => !PORTUGUESE_STOP_WORDS.has(w.toLowerCase()))
      if (words.length === 0) return ''
      if (words.length === 1) return words[0]
      return words.length === 1 ? words[0] : `(${words.join(' & ')})`
    })
    .filter(Boolean)
  return operands.join(' | ')
}

export function buildExpandedTsquery(query: string): string | null {
  const cleanQuery = query.toLowerCase()
    .replace(/rem[eé]dio\s+para\s+/g, '')
    .replace(/medicamento\s+para\s+/g, '')
    .trim()

  if (!cleanQuery || cleanQuery.length < 2) return null

  const expanded = getSynonymExpansion(cleanQuery)
  if (expanded.length === 0) return null

  return buildOrTsQuery(expanded)
}
