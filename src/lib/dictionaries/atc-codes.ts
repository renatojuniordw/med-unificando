// Source: WHO ATC/DDD Index (Portuguese translations)

export const ATC_LEVEL1: Record<string, string> = {
  'A': 'APARELHO DIGESTÓRIO E METABOLISMO',
  'B': 'SANGUE E ÓRGÃOS HEMATOPOIÉTICOS',
  'C': 'APARELHO CARDIOVASCULAR',
  'D': 'DERMATOLÓGICOS',
  'G': 'APARELHO GENITURINÁRIO E HORMÔNIOS SEXUAIS',
  'H': 'PREPARADOS HORMONAIS SISTÊMICOS',
  'J': 'ANTIINFECCIOSOS SISTÊMICOS',
  'L': 'AGENTES ANTINEOPLÁSICOS E IMUNOMODULADORES',
  'M': 'SISTEMA MUSCULOESQUELÉTICO',
  'N': 'SISTEMA NERVOSO',
  'P': 'PRODUTOS ANTIPARASITÁRIOS',
  'R': 'APARELHO RESPIRATÓRIO',
  'S': 'ÓRGÃOS DOS SENTIDOS',
  'V': 'VÁRIOS',
}

export function getAtcDescription(code: string | null | undefined): string | null {
  if (!code) return null
  const trimmed = code.trim().toUpperCase()
  if (!trimmed) return null
  const key = trimmed.charAt(0)
  return ATC_LEVEL1[key] ?? null
}

export interface AtcLevel {
  level1: string
  level2: string | null
  level3: string | null
  fullCode: string
}

export function getAtcLevel(code: string | null | undefined): AtcLevel | null {
  if (!code) return null
  return {
    level1: code.charAt(0),
    level2: code.length >= 3 ? code.substring(0, 3) : null,
    level3: code.length >= 4 ? code.substring(0, 4) : null,
    fullCode: code,
  }
}
