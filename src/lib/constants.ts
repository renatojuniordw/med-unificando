export const LOCALE = 'pt-BR'

export const STATUS = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
} as const

export const MEDICINE_LIMITS = {
  MAX_SIMILARES: 10,
  PRICE_DISPLAY_LIMIT: 20,
  PRICE_BAR_LIMIT: 5,
  MAX_HOLDER_RESULTS: 200,
  MAX_ATC_RESULTS: 200,
  MAX_REFERENCES: 100,
  SEARCH_LIMIT: 20,
  COMPARE_SEARCH_LIMIT: 10,
  ADMIN_SEARCH_LIMIT: 20,
  DEFAULT_TOP_K: 20,
  ATC_DISPLAY_LIMIT: 40,
  MAX_SUGGESTIONS: 8,
  MAX_PAGE_SIZE: 100,
} as const

export const BATCH = {
  MEDICINE_IMPORT: 500,
  PRICE_IMPORT: 500,
} as const

export const UI = {
  TOAST_DURATION_MS: 3000,
  SCROLL_THRESHOLD: 400,
} as const

export const YEARS = {
  MIN: '2000',
  MAX: '2030',
} as const

export const STORAGE_KEYS = {
  THEME: 'theme',
  FAVORITES: 'favorite-medicines',
  RECENT_SEARCHES: 'recent-searches',
} as const

export const THEME_COLORS = {
  LIGHT: '#ffffff',
  DARK: '#0f172a',
} as const

export const PDF_COLORS = {
  TEXT_SECONDARY: '#444444',
  BG_STRIPE: '#f5f5f5',
  TEXT_PRIMARY: '#222222',
} as const
