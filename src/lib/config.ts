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
  COLUMN: 'embedding' as const,
} as const

export const SEARCH = {
  // Thresholds semânticos — queries gerais
  SEMANTIC_HARD_MIN: 0.80,
  SEMANTIC_STRONG: 0.855,
  SEMANTIC_CEILING: 0.92,

  // Queries de condição com confiança alta aprovam scores >= SEMANTIC_HARD_MIN
  // sem exigit suporte keyword/trigram (ex: "queimação e dor no estômago" →
  // antiácidos têm score ~0.84 mas tsvector não cobre termos compostos).
  CONDITION_GATE_MIN_CONFIDENCE: 0.8,

  // No postProcess, resultados com score semântico >= este valor são eximidos
  // da penalidade "sem suporte" (a similaridade semântica jor é evidência).
  SEMANTIC_NO_SUPPORT_EXEMPT: 0.80,

  // Fallback híbrido: semânticos reprovados no gate mas >= este limiar entram
  // na fusão RRF com keyword + trigram.
  SEMANTIC_FALLBACK_MIN: 0.80,

  // Thresholds semânticos — queries de nome de medicamento (mais restritivos)
  SEMANTIC_HARD_MIN_NAME_QUERY: 0.88,
  SEMANTIC_STRONG_NAME_QUERY: 0.90,
  // Confiança mínima da classificação de embedding para queries de nome
  NAME_QUERY_MIN_CONFIDENCE: 0.6,

  // RRF fusion
  RRF_K: 60,
  SEMANTIC_WEIGHT: 0.40,
  KEYWORD_WEIGHT: 0.35,
  TRIGRAM_WEIGHT: 0.25,

  // Filtro de falsos positivos por substring
  SUBSTRING_MIN_LENGTH: 6,

  // Penalidade quando resultado vem de uma única fonte (sem suporte cruzado)
  SINGLE_SOURCE_PENALTY: 0.80,

  // Componentes do score honesto
  KEYWORD_SATURATION: 0.15,
  TRIGRAM_COMPONENT_DIVISOR: 0.5,

  // Penalidades de pós-processamento
  SUBSTRING_FALSE_POSITIVE_PENALTY: 0.05,
  NO_SUPPORT_PENALTY: 0.1,

  // Boosts por match de nome
  NAME_MATCH_BOOSTS: {
    exact: 0.15,
    prefix: 0.10,
    ingredient: 0.12,
    ingredientWord: 0.08,
  } as const,

  // Refinamento por embedding: só reclassifica quando a heurística de
  // classifyQuery cai no fallback genérico (baixíssima confiança)
  CLASSIFICATION_REFINE_MAX_CONFIDENCE: 0.4,

  // Cache em memória (single-process / VPS self-hosted)
  CACHE_TTL_MS: 5 * 60 * 1000,
  CACHE_MAX_ENTRIES: 500,

  // Modelo de embeddings
  MODEL_CACHE_DIR: '/tmp/.transformers-cache',

  // pgvector
  IVFFLAT_PROBES: 40,
  // HNSW: ef_search controla o recall da busca aproximada. Deve ser >= topK*5
  // (100) para o LIMIT da busca semântica não ser truncado em 40 por padrão.
  HNSW_EF_SEARCH: 100,
  PGVECTOR_TIMEOUT_MS: 30_000,

  // Quantidades padrão
  SEMANTIC_TOP_K: 60,
  HYBRID_TOP_K: 20,
  SOURCE_FETCH_MULTIPLIER: 5,
  FINAL_CUT_MARGIN: 2,
  AUTOCOMPLETE_TAKE: 8,
  DASHBOARD_TOP_K: 10,

  // Full-text search
  TSQUERY_LANGUAGE: 'portuguese',
} as const

export const SITE = {
  // NEXT_PUBLIC_BASE_URL é inline no bundle do cliente com o MESMO valor do
  // servidor — componente client (ex.: JSON-LD do Breadcrumbs) não pode ler
  // variáveis server-only (BASE_URL vira undefined no navegador e causa
  // hydration mismatch). BASE_URL continua como fallback em código server.
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'https://med.unificando.com.br',
} as const
