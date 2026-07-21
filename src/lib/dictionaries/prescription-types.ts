const PRESCRIPTION_TYPE_NAMES: Record<string, string> = {
  '1': 'VENDA SOB PRESCRIÇÃO MÉDICA',
  '2': 'TARJA VERMELHA',
  '3': 'TARJA PRETA',
  '4': 'VENDA SEM PRESCRIÇÃO',
}

export function getPrescriptionTypeName(code: string | null | undefined): string | null {
  if (!code) return null
  const trimmed = code.trim()
  if (!trimmed) return null

  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean)
    const resolved = parts.map(p => PRESCRIPTION_TYPE_NAMES[p] ?? p)
    return resolved.join(', ')
  }

  return PRESCRIPTION_TYPE_NAMES[trimmed] ?? trimmed
}
