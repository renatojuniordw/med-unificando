// Dicionário centralizado de sinônimos médicos
// Compartilhado entre keyword-search e keyword-utils

export const SYNONYM_MAP: Record<string, string[]> = {
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
  uc:          ['uc', 'ulcera', 'úlcera', 'gastrico', 'gástrico', 'protonico', 'protetor gástrico'],
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

export const COMPOUND_SUBJECTS: Record<string, string[]> = {
  'estomago': ['estômago', 'gastrico', 'gástrico', 'antiacido', 'antiácido', 'protetor gastrico', 'protetor gástrico', 'azia', 'refluxo', 'gastrite', 'ulcera', 'úlcera', 'dispepsia', 'digestao', 'digestão', 'omeprazol', 'pantoprazol', 'esomeprazol'],
  'gastrite': ['gastrite', 'estômago', 'gastrico', 'gástrico', 'antiacido', 'antiácido', 'azia', 'refluxo', 'ulcera', 'úlcera', 'protetor gastrico', 'protetor gástrico'],
  'cabeça': ['cabeça', 'cefaleia', 'migrânea', 'migranea', 'dor de cabeça', 'dor-de-cabeca', 'analgesico', 'analgésico', 'anti-inflamatorio', 'anti-inflamatório'],
  'cefaleia': ['cefaleia', 'dor de cabeça', 'dor-de-cabeca', 'migrânea', 'migranea', 'analgesico', 'analgésico', 'anti-inflamatorio', 'anti-inflamatório'],
  'gripe': ['gripe', 'resfriado', 'congestao', 'nariz', 'tosse', 'febre', 'antitérmico'],
  'pele': ['pele', 'dermatologico', 'dermatológico', 'dermatite', 'eczema', 'psoríase', 'creme', 'pomada'],
}

// Termos genéricos que casam com quase todas as linhas (ex: nomes de fabricantes)
// e devem ser removidos antes de construir a query
export const GENERIC_TERMS = new Set([
  'remedio', 'remedios', 'medicamento', 'medicamentos', 'droga', 'drogas', 'farmaco', 'farmacos',
])

// Stop words portuguesas para evitar queries vazias ou incorretas no to_tsquery
export const PORTUGUESE_STOP_WORDS = new Set([
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
