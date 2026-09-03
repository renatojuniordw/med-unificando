import { describe, it, expect, vi, beforeEach } from 'vitest'

function makeResult(id: number, score: number, extra: Record<string, unknown> = {}) {
  return {
    score,
    medicine: {
      id,
      therapeuticClass: null as string | null,
      indications: null as string | null,
      activeIngredient: null as string | null,
      ...extra,
    },
  }
}

describe('applyScoreAdjustments', () => {
  let applyScoreAdjustments: typeof import('@/lib/score-adjustments').applyScoreAdjustments
  let mockFindMany: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.resetModules()
    mockFindMany = vi.fn().mockResolvedValue([])
    vi.doMock('@/lib/prisma', () => ({
      prisma: {
        searchFeedback: {
          findMany: mockFindMany,
        },
      },
    }))
    const mod = await import('@/lib/score-adjustments')
    applyScoreAdjustments = mod.applyScoreAdjustments
  })

  it('returns empty array for empty results', async () => {
    const result = await applyScoreAdjustments('dor', [])
    expect(result).toEqual([])
  })

  it('applies DB-driven boost for high approval feedback', async () => {
    mockFindMany.mockResolvedValue([
      { query: 'dor', medicineId: 1, medicineName: 'Ibuprofeno', feedback: 'helpful' },
      { query: 'dor', medicineId: 1, medicineName: 'Ibuprofeno', feedback: 'helpful' },
      { query: 'dor', medicineId: 1, medicineName: 'Ibuprofeno', feedback: 'helpful' },
      { query: 'dor', medicineId: 1, medicineName: 'Ibuprofeno', feedback: 'helpful' },
    ])
    const results = [makeResult(1, 0.5)]
    const adjusted = await applyScoreAdjustments('dor', results)
    expect(adjusted[0].score).toBeGreaterThan(0.5)
  })

  it('applies DB-driven penalty for low approval feedback', async () => {
    mockFindMany.mockResolvedValue([
      { query: 'dor', medicineId: 1, medicineName: 'Colirio', feedback: 'notHelpful' },
      { query: 'dor', medicineId: 1, medicineName: 'Colirio', feedback: 'notHelpful' },
      { query: 'dor', medicineId: 1, medicineName: 'Colirio', feedback: 'notHelpful' },
      { query: 'dor', medicineId: 1, medicineName: 'Colirio', feedback: 'notHelpful' },
    ])
    const results = [makeResult(1, 0.5)]
    const adjusted = await applyScoreAdjustments('dor', results)
    expect(adjusted[0].score).toBeLessThan(0.5)
  })

  it('does not apply DB adjustment with fewer than 3 feedbacks', async () => {
    mockFindMany.mockResolvedValue([
      { query: 'dor', medicineId: 1, medicineName: 'Ibuprofeno', feedback: 'helpful' },
      { query: 'dor', medicineId: 1, medicineName: 'Ibuprofeno', feedback: 'helpful' },
    ])
    const results = [makeResult(1, 0.5)]
    const adjusted = await applyScoreAdjustments('dor', results)
    // Only manual adjustment applies (if any), not DB-driven
    expect(adjusted[0].score).toBe(0.5)
  })

  it('penalizes topical meds for "dor de cabeça" query', async () => {
    const results = [
      makeResult(1, 0.6, {
        therapeuticClass: 'uso tópico',
        indications: 'creme para pele',
      }),
    ]
    const adjusted = await applyScoreAdjustments('dor de cabeça', results)
    expect(adjusted[0].score).toBeLessThan(0.6)
  })

  it('penalizes non-gastric meds for "estômago" query', async () => {
    const results = [
      makeResult(1, 0.8, {
        therapeuticClass: 'oftalmologico',
        activeIngredient: 'colirio',
      }),
    ]
    const adjusted = await applyScoreAdjustments('estômago', results)
    // Score 0.8 with -0.45 (non-gastric) + -0.6 (ophthalmic) = -1.05 → clamped to 0, filtered
    // Use a higher base score or check that it was penalized
    expect(adjusted.length).toBe(0) // filtered out due to heavy penalty
  })

  it('clamps score to max 1.0', async () => {
    mockFindMany.mockResolvedValue([
      { query: 'dor', medicineId: 1, medicineName: 'Ibuprofeno', feedback: 'helpful' },
      { query: 'dor', medicineId: 1, medicineName: 'Ibuprofeno', feedback: 'helpful' },
      { query: 'dor', medicineId: 1, medicineName: 'Ibuprofeno', feedback: 'helpful' },
      { query: 'dor', medicineId: 1, medicineName: 'Ibuprofeno', feedback: 'helpful' },
      { query: 'dor', medicineId: 1, medicineName: 'Ibuprofeno', feedback: 'helpful' },
      { query: 'dor', medicineId: 1, medicineName: 'Ibuprofeno', feedback: 'helpful' },
      { query: 'dor', medicineId: 1, medicineName: 'Ibuprofeno', feedback: 'helpful' },
      { query: 'dor', medicineId: 1, medicineName: 'Ibuprofeno', feedback: 'helpful' },
      { query: 'dor', medicineId: 1, medicineName: 'Ibuprofeno', feedback: 'helpful' },
      { query: 'dor', medicineId: 1, medicineName: 'Ibuprofeno', feedback: 'helpful' },
    ])
    const results = [makeResult(1, 0.95)]
    const adjusted = await applyScoreAdjustments('dor', results)
    expect(adjusted[0].score).toBeLessThanOrEqual(1.0)
  })

  it('filters out results with score <= 0.08', async () => {
    const results = [
      makeResult(1, 0.05),
      makeResult(2, 0.5),
    ]
    const adjusted = await applyScoreAdjustments('teste', results)
    const ids = adjusted.map(r => r.medicine.id)
    expect(ids).toContain(2)
    expect(ids).not.toContain(1)
  })

  it('reorders results by adjusted score descending', async () => {
    const results = [
      makeResult(1, 0.6),
      makeResult(2, 0.4),
    ]
    const adjusted = await applyScoreAdjustments('teste', results)
    expect(adjusted[0].medicine.id).toBe(1)
    expect(adjusted[1].medicine.id).toBe(2)
  })

  it('penalizes deceptive name (Stomup-like) for "estômago" query', async () => {
    const results = [
      makeResult(1, 0.8, {
        therapeuticClass: 'colirio',
        tradeName: 'Stomup Gotas',
        activeIngredient: 'cloridrato de tetrizolina',
      }),
    ]
    const adjusted = await applyScoreAdjustments('estômago', results)
    // -0.45 (non-gastric) + -0.4 (deceptive name) → abaixo do filtro 0.08
    expect(adjusted.length).toBe(0)
  })

  it('does not apply deceptive penalty for non-stomach queries', async () => {
    const results = [
      makeResult(1, 0.6, {
        therapeuticClass: 'colirio',
        tradeName: 'Stomup Gotas',
        activeIngredient: 'cloridrato de tetrizolina',
      }),
    ]
    const adjusted = await applyScoreAdjustments('dor de cabeça', results)
    // Query de tópico diferente → sem penalidade de estômago; score preservado
    expect(adjusted[0].medicine.id).toBe(1)
    expect(adjusted[0].score).toBe(0.6)
  })

  it('does not apply manually hardcoded "articulação" boost anymore', async () => {
    const results = [makeResult(1, 0.5)]
    const adjusted = await applyScoreAdjustments('articulação', results)
    // Regra manual removida: sem feedbacks no banco, score permanece inalterado
    expect(adjusted[0].score).toBe(0.5)
  })
})
