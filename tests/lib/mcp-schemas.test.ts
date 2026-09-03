import { describe, it, expect } from 'vitest'
import { medicineListSchema } from '@/lib/mcp/tools/filters'
import { buscarMedicamentos, autocompleteCampo } from '@/lib/mcp/tools/medicines'
import { buscarPorDescricao } from '@/lib/mcp/tools/search'
import { detalheMedicamento } from '@/lib/mcp/tools/detail'
import { compararMedicamentos } from '@/lib/mcp/tools/compare'
import { medicamentosPorDetentor, resumoDetentor } from '@/lib/mcp/tools/holder'
import { medicamentosPorAtc, arvoreAtc } from '@/lib/mcp/tools/atc'
import { estatisticasMedicamentos } from '@/lib/mcp/tools/stats'
import { referenciasMedicamento, similaresReferencia } from '@/lib/mcp/tools/references'

describe('medicineListSchema', () => {
  it('aceita filtros vazios', () => {
    expect(medicineListSchema.parse({})).toEqual({})
  })

  it('aceita todos os filtros de SearchFilters', () => {
    const result = medicineListSchema.parse({
      query: 'dor',
      reference: '1',
      activeIngredient: 'dipirona',
      tradeName: 'novalgina',
      similarHolder: 'empresa',
      pharmaceuticalForm: 'comprimido',
      category: 'Similar',
      status: 'Ativo',
      farmaciaPopular: true,
    })
    expect(result).toMatchObject({
      query: 'dor',
      farmaciaPopular: true,
    })
  })

  it('rejeita page zero e pageSize acima do teto', () => {
    expect(medicineListSchema.safeParse({ page: 0 }).success).toBe(false)
    expect(medicineListSchema.safeParse({ pageSize: 101 }).success).toBe(false)
    expect(medicineListSchema.safeParse({ pageSize: 100 }).success).toBe(true)
  })

  it('buscar_medicamentos usa o mesmo schema', () => {
    expect(buscarMedicamentos.inputSchema).toBe(medicineListSchema)
  })
})

describe('schemas por tool', () => {
  it('autocomplete_campo valida field enum', () => {
    expect(autocompleteCampo.inputSchema.safeParse({ field: 'tradeName', q: 'dip' }).success).toBe(true)
    expect(autocompleteCampo.inputSchema.safeParse({ field: 'inexistente', q: 'dip' }).success).toBe(false)
    expect(autocompleteCampo.inputSchema.safeParse({ field: 'tradeName', q: '' }).success).toBe(false)
  })

  it('buscar_por_descricao exige query e limita topK', () => {
    expect(buscarPorDescricao.inputSchema.safeParse({ query: '' }).success).toBe(false)
    expect(buscarPorDescricao.inputSchema.safeParse({ query: 'dor', topK: 5 }).success).toBe(true)
    expect(buscarPorDescricao.inputSchema.safeParse({ query: 'dor', topK: 0 }).success).toBe(false)
  })

  it('detalhe_medicamento exige id positivo inteiro', () => {
    expect(detalheMedicamento.inputSchema.safeParse({ id: 1 }).success).toBe(true)
    expect(detalheMedicamento.inputSchema.safeParse({ id: 0 }).success).toBe(false)
    expect(detalheMedicamento.inputSchema.safeParse({ id: 1.5 }).success).toBe(false)
  })

  it('comparar_medicamentos exige ids OU query', () => {
    expect(compararMedicamentos.inputSchema.safeParse({ ids: [1, 2] }).success).toBe(true)
    expect(compararMedicamentos.inputSchema.safeParse({ query: 'dipirona' }).success).toBe(true)
    expect(compararMedicamentos.inputSchema.safeParse({}).success).toBe(false)
    expect(compararMedicamentos.inputSchema.safeParse({ ids: [] }).success).toBe(false)
  })

  it('medicamentos_por_detentor e resumo_detentor exigem holder', () => {
    expect(medicamentosPorDetentor.inputSchema.safeParse({ holder: 'x' }).success).toBe(true)
    expect(medicamentosPorDetentor.inputSchema.safeParse({}).success).toBe(false)
    expect(resumoDetentor.inputSchema.safeParse({ holder: 'x' }).success).toBe(true)
  })

  it('medicamentos_por_atc exige code com paginação opcional', () => {
    expect(medicamentosPorAtc.inputSchema.safeParse({ code: 'N02' }).success).toBe(true)
    expect(medicamentosPorAtc.inputSchema.safeParse({ code: 'N02', pageSize: 100 }).success).toBe(true)
    expect(medicamentosPorAtc.inputSchema.safeParse({ code: 'N02', pageSize: 101 }).success).toBe(false)
    expect(medicamentosPorAtc.inputSchema.safeParse({}).success).toBe(false)
  })

  it('arvore_atc e estatisticas aceitam entrada vazia/filtros', () => {
    expect(arvoreAtc.inputSchema.safeParse({}).success).toBe(true)
    expect(estatisticasMedicamentos.inputSchema.safeParse({}).success).toBe(true)
    expect(estatisticasMedicamentos.inputSchema.safeParse({ year: '2024', category: 'Similar', status: 'Ativo' }).success).toBe(true)
  })

  it('referencias e similares validam query/name', () => {
    expect(referenciasMedicamento.inputSchema.safeParse({}).success).toBe(true)
    expect(referenciasMedicamento.inputSchema.safeParse({ query: 'dip' }).success).toBe(true)
    expect(similaresReferencia.inputSchema.safeParse({ name: 'DIPIRONA' }).success).toBe(true)
    expect(similaresReferencia.inputSchema.safeParse({}).success).toBe(false)
  })
})