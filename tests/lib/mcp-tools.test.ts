import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/actions/search', () => ({
  searchMedicines: vi.fn(),
  searchAutocomplete: vi.fn(),
  getHolderMedicines: vi.fn(),
  getHolderSummary: vi.fn(),
  getDashboardStats: vi.fn(),
  getFilteredStats: vi.fn(),
}))

vi.mock('@/lib/actions/semantic-search', () => ({
  hybridSearch: vi.fn(),
}))

vi.mock('@/lib/actions/medicine-detail', () => ({
  getMedicineDetail: vi.fn(),
}))

vi.mock('@/lib/actions/references', () => ({
  getReferenceMedicines: vi.fn(),
  searchReferenceMedicines: vi.fn(),
  getSimilaresByReference: vi.fn(),
}))

vi.mock('@/lib/actions/atc', () => ({
  getAtcLevels: vi.fn(),
  getMedicinesByAtc: vi.fn(),
}))

vi.mock('@/lib/actions/compare', () => ({
  getMedicinesByIds: vi.fn(),
  searchMedicinesForCompare: vi.fn(),
}))

import { searchMedicines, searchAutocomplete, getHolderMedicines, getHolderSummary, getDashboardStats, getFilteredStats } from '@/lib/actions/search'
import { hybridSearch } from '@/lib/actions/semantic-search'
import { getMedicineDetail } from '@/lib/actions/medicine-detail'
import { getReferenceMedicines, searchReferenceMedicines, getSimilaresByReference } from '@/lib/actions/references'
import { getAtcLevels, getMedicinesByAtc } from '@/lib/actions/atc'
import { getMedicinesByIds, searchMedicinesForCompare } from '@/lib/actions/compare'
import { buscarMedicamentos, autocompleteCampo } from '@/lib/mcp/tools/medicines'
import { buscarPorDescricao } from '@/lib/mcp/tools/search'
import { detalheMedicamento } from '@/lib/mcp/tools/detail'
import { referenciasMedicamento, similaresReferencia } from '@/lib/mcp/tools/references'
import { arvoreAtc, medicamentosPorAtc } from '@/lib/mcp/tools/atc'
import { medicamentosPorDetentor, resumoDetentor } from '@/lib/mcp/tools/holder'
import { compararMedicamentos } from '@/lib/mcp/tools/compare'
import { estatisticasMedicamentos } from '@/lib/mcp/tools/stats'

describe('tools MCP → actions (mapeamento)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('buscar_medicamentos repassa filtros e paginação com defaults', async () => {
    vi.mocked(searchMedicines).mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 10 })
    const result = await buscarMedicamentos.handler({ query: 'dor', status: 'Ativo' } as never)
    expect(searchMedicines).toHaveBeenCalledWith(1, 10, { query: 'dor', status: 'Ativo' })
    expect(result).toEqual({ data: [], total: 0, page: 1, pageSize: 10 })
  })

  it('buscar_medicamentos usa page/pageSize explícitos', async () => {
    vi.mocked(searchMedicines).mockResolvedValue({ data: [], total: 0, page: 2, pageSize: 50 })
    await buscarMedicamentos.handler({ page: 2, pageSize: 50 } as never)
    expect(searchMedicines).toHaveBeenCalledWith(2, 50, {})
  })

  it('buscar_por_descricao chama hybridSearch', async () => {
    vi.mocked(hybridSearch).mockResolvedValue({ results: [], suggestions: [] })
    await buscarPorDescricao.handler({ query: 'queimação no estômago' } as never)
    expect(hybridSearch).toHaveBeenCalledWith('queimação no estômago', undefined)
  })

  it('autocomplete_campo mapeia campo + termo', async () => {
    vi.mocked(searchAutocomplete).mockResolvedValue([{ value: 'DIPIRONA' }])
    await autocompleteCampo.handler({ field: 'activeIngredient', q: 'dip' } as never)
    expect(searchAutocomplete).toHaveBeenCalledWith('activeIngredient', 'dip')
  })

  it('detalhe_medicamento devolve erro amigável quando não encontrado', async () => {
    vi.mocked(getMedicineDetail).mockResolvedValue(null)
    await expect(detalheMedicamento.handler({ id: 999 } as never)).resolves.toEqual({ error: 'Medicamento não encontrado' })
    vi.mocked(getMedicineDetail).mockResolvedValue({ medicine: {}, prices: [], similares: [] } as never)
    await expect(detalheMedicamento.handler({ id: 1 } as never)).resolves.toEqual({ medicine: {}, prices: [], similares: [] })
  })

  it('referencias_medicamento: sem query usa listagem, com query usa busca', async () => {
    vi.mocked(getReferenceMedicines).mockResolvedValue([{ name: 'DIPIRONA', count: 3 }])
    vi.mocked(searchReferenceMedicines).mockResolvedValue([{ name: 'DIPIRONA', count: 3 }])
    await referenciasMedicamento.handler({} as never)
    expect(getReferenceMedicines).toHaveBeenCalled()
    await referenciasMedicamento.handler({ query: 'dip' } as never)
    expect(searchReferenceMedicines).toHaveBeenCalledWith('dip')
  })

  it('similares_referencia chama por nome', async () => {
    vi.mocked(getSimilaresByReference).mockResolvedValue([])
    await similaresReferencia.handler({ name: 'DIPIRONA' } as never)
    expect(getSimilaresByReference).toHaveBeenCalledWith('DIPIRONA')
  })

  it('arvore_atc e medicamentos_por_atc repassam código e paginação', async () => {
    vi.mocked(getAtcLevels).mockResolvedValue({ level1: [], level2: [], level3: [] })
    await arvoreAtc.handler()
    expect(getAtcLevels).toHaveBeenCalled()

    vi.mocked(getMedicinesByAtc).mockResolvedValue({ data: [], total: 0, ativos: 0, page: 1, pageSize: 20 })
    await medicamentosPorAtc.handler({ code: 'N02', pageSize: 50 } as never)
    expect(getMedicinesByAtc).toHaveBeenCalledWith('N02', 1, 50)
  })

  it('medicamentos_por_detentor e resumo_detentor usam holder', async () => {
    vi.mocked(getHolderMedicines).mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 })
    await medicamentosPorDetentor.handler({ holder: 'EMP', search: 'dip', status: 'Ativo' } as never)
    expect(getHolderMedicines).toHaveBeenCalledWith('EMP', 1, 20, 'dip', 'Ativo')

    vi.mocked(getHolderSummary).mockResolvedValue({ holderName: 'EMP', total: 1, ativos: 1, categoriasCount: 1 })
    await resumoDetentor.handler({ holder: 'EMP' } as never)
    expect(getHolderSummary).toHaveBeenCalledWith('EMP')
  })

  it('comparar_medicamentos: com ids chama direto; com query busca antes', async () => {
    vi.mocked(getMedicinesByIds).mockResolvedValue([])
    await compararMedicamentos.handler({ ids: [1, 2] } as never)
    expect(getMedicinesByIds).toHaveBeenCalledWith([1, 2])
    expect(searchMedicinesForCompare).not.toHaveBeenCalled()

    vi.mocked(searchMedicinesForCompare).mockResolvedValue([{ id: 7, label: 'X' }])
    await compararMedicamentos.handler({ query: 'dip' } as never)
    expect(searchMedicinesForCompare).toHaveBeenCalledWith('dip')
    expect(getMedicinesByIds).toHaveBeenCalledWith([7])
  })

  it('estatisticas_medicamentos: sem filtros usa dashboard; com filtros usa filtered stats', async () => {
    vi.mocked(getDashboardStats).mockResolvedValue({ totalMedicines: 1 } as never)
    vi.mocked(getFilteredStats).mockResolvedValue({ total: 1, ativos: 1, inativos: 0, topTrade: [], topIngredient: [] })
    await estatisticasMedicamentos.handler({} as never)
    expect(getDashboardStats).toHaveBeenCalled()
    expect(getFilteredStats).not.toHaveBeenCalled()

    await estatisticasMedicamentos.handler({ year: '2024', status: 'Ativo' } as never)
    expect(getFilteredStats).toHaveBeenCalledWith({ year: '2024', category: undefined, status: 'Ativo' })
  })
})