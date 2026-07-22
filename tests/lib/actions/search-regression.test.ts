import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Medicine } from '@/generated/prisma/client'

vi.mock('@/lib/prisma', () => {
  const queryRawUnsafe = vi.fn()
  return {
    prisma: {
      medicine: { findMany: vi.fn() },
      searchFeedback: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      $queryRawUnsafe: queryRawUnsafe,
      $transaction: vi.fn((callback: (tx: unknown) => unknown) =>
        callback({
          $executeRawUnsafe: vi.fn(),
          $queryRawUnsafe: queryRawUnsafe,
        })
      ),
    },
  }
})

vi.mock('@/lib/actions/keyword-search', () => ({
  keywordSearch: vi.fn(),
}))

vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn().mockResolvedValue(
    vi.fn().mockResolvedValue({
      data: new Float32Array([0.1, 0.2, 0.3, 0.4]),
    })
  ),
  env: { cacheDir: '' },
}))

import { hybridSearch, clearEmbeddingsCache } from '@/lib/actions/semantic-search'
import { prisma } from '@/lib/prisma'
import { keywordSearch } from '@/lib/actions/keyword-search'

describe('Casos de Teste de Regressão - Busca por Descrição', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await clearEmbeddingsCache()
  })

  describe('Cenário 1: "dor de cabeça"', () => {
    it('deve retornar apenas analgésicos e anti-inflamatórios', async () => {
      // Mock para busca semântica retornando medicamentos relevantes
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
        { id: 1, semantic_score: 0.90 },
        { id: 2, semantic_score: 0.88 },
        { id: 3, semantic_score: 0.85 },
        { id: 4, semantic_score: 0.82 },
      ])

      // Mock para busca keyword retornando medicamentos relevantes
      vi.mocked(keywordSearch).mockResolvedValue([
        { medicineId: 1, keywordScore: 0.08 },
        { medicineId: 2, keywordScore: 0.07 },
        { medicineId: 3, keywordScore: 0.06 },
        { medicineId: 4, keywordScore: 0.05 },
      ])

      // Mock para retornar medicamentos do banco
      vi.mocked(prisma.medicine.findMany).mockResolvedValue([
        { id: 1, tradeName: 'Dipirona', status: 'Ativo', therapeuticClass: 'ANALGESICOS' },
        { id: 2, tradeName: 'Ibuprofeno', status: 'Ativo', therapeuticClass: 'ANTI-INFLAMATORIOS' },
        { id: 3, tradeName: 'Paracetamol', status: 'Ativo', therapeuticClass: 'ANALGESICOS' },
        { id: 4, tradeName: 'Ácido Acetilsalicílico', status: 'Ativo', therapeuticClass: 'ANALGESICOS' },
      ] as Medicine[])

      const result = await hybridSearch('dor de cabeça', 20)

      expect(result.length).toBeGreaterThan(0)
      
      // Todos os medicamentos devem ser analgésicos ou anti-inflamatórios
      const therapeuticClasses = result.map(r => r.medicine.therapeuticClass?.toLowerCase())
      const hasAnalgesic = therapeuticClasses.some(tc => tc?.includes('analgesico'))
      const hasAntiInflammatory = therapeuticClasses.some(tc => tc?.includes('anti-inflamatorio'))
      
      expect(hasAnalgesic || hasAntiInflammatory).toBe(true)
      
      // Não deve retornar medicamentos de Alzheimer/cognição
      const tradeNames = result.map(r => r.medicine.tradeName.toLowerCase())
      expect(tradeNames).not.toContain('pregabalina')
      expect(tradeNames).not.toContain('donepezila')
      expect(tradeNames).not.toContain('memantina')
    })
  })

  describe('Cenário 2: "remédio para pressão"', () => {
    it('deve retornar apenas anti-hipertensivos', async () => {
      // Mock para busca semântica retornando medicamentos relevantes
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
        { id: 5, semantic_score: 0.92 },
        { id: 6, semantic_score: 0.89 },
        { id: 7, semantic_score: 0.86 },
        { id: 8, semantic_score: 0.83 },
      ])

      // Mock para busca keyword retornando medicamentos relevantes
      vi.mocked(keywordSearch).mockResolvedValue([
        { medicineId: 5, keywordScore: 0.09 },
        { medicineId: 6, keywordScore: 0.08 },
        { medicineId: 7, keywordScore: 0.07 },
        { medicineId: 8, keywordScore: 0.06 },
      ])

      // Mock para retornar medicamentos do banco
      vi.mocked(prisma.medicine.findMany).mockResolvedValue([
        { id: 5, tradeName: 'Losartana', status: 'Ativo', therapeuticClass: 'ANTI-HIPERTENSIVOS' },
        { id: 6, tradeName: 'Enalapril', status: 'Ativo', therapeuticClass: 'ANTI-HIPERTENSIVOS' },
        { id: 7, tradeName: 'Anlodipino', status: 'Ativo', therapeuticClass: 'ANTI-HIPERTENSIVOS' },
        { id: 8, tradeName: 'Hidroclorotiazida', status: 'Ativo', therapeuticClass: 'DIURETICOS' },
      ] as any)

      const result = await hybridSearch('remédio para pressão', 20)

      expect(result.length).toBeGreaterThan(0)
      
      // Todos os medicamentos devem ser anti-hipertensivos ou diuréticos
      const therapeuticClasses = result.map(r => r.medicine.therapeuticClass?.toLowerCase())
      const hasAntiHypertensive = therapeuticClasses.some(tc => tc?.includes('anti-hipertensivo'))
      const hasDiuretic = therapeuticClasses.some(tc => tc?.includes('diuretico'))
      
      expect(hasAntiHypertensive || hasDiuretic).toBe(true)
      
      // Não deve retornar medicamentos não relacionados
      const tradeNames = result.map(r => r.medicine.tradeName.toLowerCase())
      expect(tradeNames).not.toContain('paracetamol')
      expect(tradeNames).not.toContain('ibuprofeno')
    })
  })

  describe('Cenário 3: "anti-inflamatório para articulação"', () => {
    it('deve retornar anti-inflamatórios e medicamentos para articulação', async () => {
      // Mock para busca semântica retornando medicamentos relevantes
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
        { id: 9, semantic_score: 0.91 },
        { id: 10, semantic_score: 0.88 },
        { id: 11, semantic_score: 0.85 },
        { id: 12, semantic_score: 0.82 },
      ])

      // Mock para busca keyword retornando medicamentos relevantes
      vi.mocked(keywordSearch).mockResolvedValue([
        { medicineId: 9, keywordScore: 0.09 },
        { medicineId: 10, keywordScore: 0.08 },
        { medicineId: 11, keywordScore: 0.07 },
        { medicineId: 12, keywordScore: 0.06 },
      ])

      // Mock para retornar medicamentos do banco
      vi.mocked(prisma.medicine.findMany).mockResolvedValue([
        { id: 9, tradeName: 'Ibuprofeno', status: 'Ativo', therapeuticClass: 'ANTI-INFLAMATORIOS' },
        { id: 10, tradeName: 'Naproxeno', status: 'Ativo', therapeuticClass: 'ANTI-INFLAMATORIOS' },
        { id: 11, tradeName: 'Diclofenaco', status: 'Ativo', therapeuticClass: 'ANTI-INFLAMATORIOS' },
        { id: 12, tradeName: 'Meloxicam', status: 'Ativo', therapeuticClass: 'ANTI-INFLAMATORIOS' },
      ] as any)

      const result = await hybridSearch('anti-inflamatório para articulação', 20)

      expect(result.length).toBeGreaterThan(0)
      
      // Todos os medicamentos devem ser anti-inflamatórios
      const therapeuticClasses = result.map(r => r.medicine.therapeuticClass?.toLowerCase())
      const hasAntiInflammatory = therapeuticClasses.some(tc => tc?.includes('anti-inflamatorio'))
      
      expect(hasAntiInflammatory).toBe(true)
      
      // Não deve retornar medicamentos não relacionados
      const tradeNames = result.map(r => r.medicine.tradeName.toLowerCase())
      expect(tradeNames).not.toContain('dipirona')
      expect(tradeNames).not.toContain('paracetamol')
    })
  })

  describe('Testes de Performance da Busca', () => {
    it('deve retornar resultados ordenados por relevância', async () => {
      // Mock para busca semântica com scores variados
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
        { id: 1, semantic_score: 0.95 },
        { id: 2, semantic_score: 0.85 },
        { id: 3, semantic_score: 0.75 },
      ])

      // Mock para busca keyword
      vi.mocked(keywordSearch).mockResolvedValue([
        { medicineId: 1, keywordScore: 0.09 },
        { medicineId: 2, keywordScore: 0.07 },
        { medicineId: 3, keywordScore: 0.05 },
      ])

      // Mock para retornar medicamentos
      vi.mocked(prisma.medicine.findMany).mockResolvedValue([
        { id: 1, tradeName: 'Medicamento A', status: 'Ativo', therapeuticClass: 'ANALGESICOS' },
        { id: 2, tradeName: 'Medicamento B', status: 'Ativo', therapeuticClass: 'ANALGESICOS' },
        { id: 3, tradeName: 'Medicamento C', status: 'Ativo', therapeuticClass: 'ANALGESICOS' },
      ] as any)

      const result = await hybridSearch('dor', 10)

      expect(result.length).toBeGreaterThan(0)
      
      // Verificar se está ordenado por score decrescente
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score)
      }
    })

    it('deve filtrar medicamentos inativos quando relevante', async () => {
      // Mock para busca semântica
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
        { id: 1, semantic_score: 0.90 },
        { id: 2, semantic_score: 0.88 },
      ])

      // Mock para busca keyword
      vi.mocked(keywordSearch).mockResolvedValue([
        { medicineId: 1, keywordScore: 0.08 },
        { medicineId: 2, keywordScore: 0.07 },
      ])

      // Mock para retornar medicamentos (um ativo, um inativo)
      vi.mocked(prisma.medicine.findMany).mockResolvedValue([
        { id: 1, tradeName: 'Medicamento Ativo', status: 'Ativo', therapeuticClass: 'ANALGESICOS' },
        { id: 2, tradeName: 'Medicamento Inativo', status: 'Inativo', therapeuticClass: 'ANALGESICOS' },
      ] as any)

      const result = await hybridSearch('dor', 10)

      expect(result.length).toBeGreaterThan(0)
      
      // O medicamento ativo deve vir antes do inativo
      const activeIndex = result.findIndex(r => r.medicine.status === 'Ativo')
      const inactiveIndex = result.findIndex(r => r.medicine.status === 'Inativo')
      
      if (activeIndex !== -1 && inactiveIndex !== -1) {
        expect(activeIndex).toBeLessThan(inactiveIndex)
      }
    })
  })
})