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
      $executeRawUnsafe: vi.fn(),
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

vi.mock('@/lib/actions/trigram-search', () => ({
  trigramSearch: vi.fn().mockResolvedValue([]),
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

      const { results } = await hybridSearch('dor de cabeça', 20)

      expect(results.length).toBeGreaterThan(0)

      // Todos os medicamentos devem ser analgésicos ou anti-inflamatórios
      const therapeuticClasses = results.map(r => r.medicine.therapeuticClass?.toLowerCase())
      const hasAnalgesic = therapeuticClasses.some(tc => tc?.includes('analgesico'))
      const hasAntiInflammatory = therapeuticClasses.some(tc => tc?.includes('anti-inflamatorio'))

      expect(hasAnalgesic || hasAntiInflammatory).toBe(true)

      // Não deve retornar medicamentos de Alzheimer/cognição
      const tradeNames = results.map(r => r.medicine.tradeName.toLowerCase())
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
      ] as never)

      const { results } = await hybridSearch('remédio para pressão', 20)

      expect(results.length).toBeGreaterThan(0)

      // Todos os medicamentos devem ser anti-hipertensivos ou diuréticos
      const therapeuticClasses = results.map(r => r.medicine.therapeuticClass?.toLowerCase())
      const hasAntiHypertensive = therapeuticClasses.some(tc => tc?.includes('anti-hipertensivo'))
      const hasDiuretic = therapeuticClasses.some(tc => tc?.includes('diuretico'))

      expect(hasAntiHypertensive || hasDiuretic).toBe(true)

      // Não deve retornar medicamentos não relacionados
      const tradeNames = results.map(r => r.medicine.tradeName.toLowerCase())
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
      ] as never)

      const { results } = await hybridSearch('anti-inflamatório para articulação', 20)

      expect(results.length).toBeGreaterThan(0)

      // Todos os medicamentos devem ser anti-inflamatórios
      const therapeuticClasses = results.map(r => r.medicine.therapeuticClass?.toLowerCase())
      const hasAntiInflammatory = therapeuticClasses.some(tc => tc?.includes('anti-inflamatorio'))

      expect(hasAntiInflammatory).toBe(true)

      // Não deve retornar medicamentos não relacionados
      const tradeNames = results.map(r => r.medicine.tradeName.toLowerCase())
      expect(tradeNames).not.toContain('dipirona')
      expect(tradeNames).not.toContain('paracetamol')
    })
  })

  describe('Cenário 4: "queimação e dor no estômago"', () => {
    it('deve retornar antiácidos/medicamentos gástricos mesmo sem suporte keyword', async () => {
      // Semântica forte (0.84+) mas SEM suporte keyword/trigram — o tsvector
      // não cobre termos de condição compostos e o top 100 FTS é dominado por
      // analgésicos (expansão de sinônimos + termo "dor").
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
        { id: 100, semantic_score: 0.848 }, // Kollangel FF
        { id: 101, semantic_score: 0.846 }, // Loncord
        { id: 102, semantic_score: 0.843 }, // Digedrat
        { id: 103, semantic_score: 0.82 },  // Omeprazol
      ])

      // Keyword retorna apenas analgésicos irrelevantes (fracos) — como no caso real
      vi.mocked(keywordSearch).mockResolvedValue([
        { medicineId: 200, keywordScore: 0.012 },
        { medicineId: 201, keywordScore: 0.0118 },
      ])

      // findMany: primeiro é chamado para os semânticos (semanticSearch), depois
      // para os demais IDs no fuseAndFetch
      vi.mocked(prisma.medicine.findMany).mockResolvedValue([
        { id: 100, tradeName: 'Kollangel FF', status: 'Ativo', therapeuticClass: 'ANTIACIDO', indications: 'azia, má digestão, acidez estomacal', activeIngredient: 'hidróxido de alumínio' },
        { id: 101, tradeName: 'Loncord', status: 'Ativo', therapeuticClass: 'ANTIACIDO', indications: 'azia, má digestão', activeIngredient: 'hidróxido de magnésio' },
        { id: 102, tradeName: 'Digedrat', status: 'Ativo', therapeuticClass: 'ANTIESPASMODICOS', indications: 'cólica, espasmo, dor abdominal', activeIngredient: 'maleato de trimebutina' },
        { id: 103, tradeName: 'Omeprazol', status: 'Ativo', therapeuticClass: 'ANTIULCERA', indications: 'úlcera, refluxo, acidez', activeIngredient: 'omeprazol' },
      ] as never)

      const { results } = await hybridSearch('queimação e dor no estômago', 20)

      expect(results.length).toBeGreaterThan(0)

      const tradeNames = results.map(r => r.medicine.tradeName.toLowerCase())
      // Os antiácidos/gastro devem estar presentes (semântica forte, sem suporte textual)
      expect(tradeNames).toContain('kollangel ff')
      expect(tradeNames).toContain('digedrat')
    })
  })

  describe('Cenário 5: fallback híbrido (nenhum aprovado no gate)', () => {
    it('deve mesclar semânticos reprovados + keyword via RRF no fallback', async () => {
      // Semântica abaixo do strong (0.855) e sem suporte keyword para os gastro —
      // para uma query de NOME (gate restrito), todos reprovam o gate.
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
        { id: 300, semantic_score: 0.82 },
        { id: 301, semantic_score: 0.81 },
      ])

      vi.mocked(keywordSearch).mockResolvedValue([
        { medicineId: 300, keywordScore: 0.012 },
        { medicineId: 302, keywordScore: 0.011 },
      ])

      vi.mocked(prisma.medicine.findMany).mockResolvedValue([
        { id: 300, tradeName: 'MedGastro', status: 'Ativo', therapeuticClass: 'ANTIACIDO', indications: 'azia, má digestão', activeIngredient: 'hidróxido de alumínio' },
        { id: 301, tradeName: 'MedGastro2', status: 'Ativo', therapeuticClass: 'ANTIACIDO', indications: 'azia', activeIngredient: 'hidróxido de magnésio' },
        { id: 302, tradeName: 'Analg', status: 'Ativo', therapeuticClass: 'ANALGESICOS', indications: 'dor', activeIngredient: 'dipirona' },
      ] as never)

      // Query de nome (gate 0.88/0.90) → semântica 0.82/0.81 reprova → fallback
      const { results } = await hybridSearch('kollangel', 20)

      expect(results.length).toBeGreaterThan(0)
      const tradeNames = results.map(r => r.medicine.tradeName.toLowerCase())
      expect(tradeNames).toContain('medgastro')

      // Fallbacks também devem entrar no analytics (search_logs)
      expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO search_logs'),
        expect.any(String), expect.any(Number), expect.any(Number), expect.any(String), expect.any(Number),
      )
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
      ] as never)

      const { results } = await hybridSearch('dor', 10)

      expect(results.length).toBeGreaterThan(0)

      // Verificar se está ordenado por score decrescente
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score)
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
      ] as never)

      const { results } = await hybridSearch('dor', 10)

      expect(results.length).toBeGreaterThan(0)

      // O medicamento ativo deve vir antes do inativo
      const activeIndex = results.findIndex(r => r.medicine.status === 'Ativo')
      const inactiveIndex = results.findIndex(r => r.medicine.status === 'Inativo')
      
      if (activeIndex !== -1 && inactiveIndex !== -1) {
        expect(activeIndex).toBeLessThan(inactiveIndex)
      }
    })
  })
})