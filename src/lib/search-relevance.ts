// Translates the absolute confidence score from hybridSearch (see
// src/lib/actions/semantic-search.ts) into a label a user can act on without
// having to interpret a raw percentage. Bands were picked from the score
// distributions observed during calibration: solid domain matches land
// ~55-85%, weaker-but-plausible ones ~30-55%, and off-topic queries (e.g. a
// search that isn't really about a medicine) settle around 20-30%.
//
// ATUALIZAÇÃO: Ajustado thresholds para melhor cobertura de medicamentos
// clássicos que podem ter scores mais baixos mas indicações compatíveis.
export type RelevanceTier = 'high' | 'medium' | 'low'

export interface RelevanceLabel {
  tier: RelevanceTier
  label: string
}

export function getRelevanceLabel(score: number): RelevanceLabel {
  // Thresholds ajustados para melhorar cobertura:
  // - Alta: 50% (antes 55%) - medicamentos clássicos com boa correspondência
  // - Parcial: 25% (antes 30%) - medicamentos com alguma correspondência
  // - Baixa: < 25% - medicamentos com pouca correspondência
  if (score >= 0.50) return { tier: 'high', label: 'Alta correspondência' }
  if (score >= 0.25) return { tier: 'medium', label: 'Correspondência parcial' }
  return { tier: 'low', label: 'Baixa correspondência' }
}
