export const ANVISA = {
  MEDICINES_URL: process.env.ANVISA_MEDICINES_URL
    ?? 'https://dados.anvisa.gov.br/dados/CONSULTAS/PRODUTOS/TA_CONSULTA_MEDICAMENTOS.CSV',
  THERAPEUTIC_CLASS_URL: process.env.ANVISA_THERAPEUTIC_CLASS_URL
    ?? 'https://dados.anvisa.gov.br/dados/DADOS_ABERTOS_MEDICAMENTOS.csv',
  PRICES_URL: process.env.ANVISA_PRICES_URL
    ?? 'https://dados.anvisa.gov.br/dados/TA_PRECOS_MEDICAMENTOS.csv',
  BULA_URL: 'https://consultas.anvisa.gov.br/#/medicamento/',
} as const

export const EMBEDDING = {
  MODEL: process.env.EMBEDDING_MODEL ?? 'Xenova/multilingual-e5-base',
  DIMS: parseInt(process.env.EMBEDDING_DIMS ?? '768', 10),
  // Coluna ativa: troque para 'embedding' quando a migracao estiver completa
  COLUMN: (process.env.EMBEDDING_COLUMN ?? 'embedding_new') as 'embedding' | 'embedding_new',
} as const

export const SEARCH = {
  // Thresholds semânticos — queries gerais
  SEMANTIC_HARD_MIN: 0.80,
  SEMANTIC_STRONG: 0.855,
  SEMANTIC_CEILING: 0.92,

  // Thresholds semânticos — queries de nome de medicamento (mais restritivos)
  SEMANTIC_HARD_MIN_NAME_QUERY: 0.88,
  SEMANTIC_STRONG_NAME_QUERY: 0.90,

  // RRF fusion
  RRF_K: 60,
  SEMANTIC_WEIGHT: 0.40,
  KEYWORD_WEIGHT: 0.35,
  TRIGRAM_WEIGHT: 0.25,

  // Trigram
  TRIGRAM_MIN_THRESHOLD: 0.15,
  TRIGRAM_MIN_THRESHOLD_NAME: 0.30,

  // Filtro de falsos positivos por substring
  SUBSTRING_MIN_LENGTH: 6,

  // Penalidade quando resultado vem de uma única fonte (sem suporte cruzado)
  SINGLE_SOURCE_PENALTY: 0.80,
} as const

export const SITE = {
  BASE_URL: process.env.BASE_URL ?? 'https://medicamentos.unificando.com.br',
} as const
