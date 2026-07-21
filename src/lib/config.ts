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
  MODEL: process.env.EMBEDDING_MODEL ?? 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
} as const

export const SITE = {
  BASE_URL: process.env.BASE_URL ?? 'https://medicamentos.unificando.com.br',
} as const
