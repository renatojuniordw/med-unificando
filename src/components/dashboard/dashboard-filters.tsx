'use client'

import { useState } from 'react'
import { getFilteredStats } from '@/lib/actions/search'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { DashboardStats } from '@/types'

interface Props {
  availableYears: string[]
  categories: string[]
  initialStats: DashboardStats
}

export function DashboardFilters({ availableYears, categories, initialStats }: Props) {
  const [year, setYear] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(false)

  async function applyFilters() {
    setLoading(true)
    const filtered = await getFilteredStats({ year: year || undefined, category: category || undefined, status: status || undefined })
    setStats({
      totalMedicines: filtered.total,
      totalReferences: filtered.topTrade.length,
      ativoCount: filtered.ativos,
      inativoCount: filtered.inativos,
      topReferences: filtered.topTrade,
      topActiveIngredients: filtered.topIngredient,
      categories: initialStats.categories,
      timeline: initialStats.timeline,
      availableYears,
    })
    setLoading(false)
  }

  function resetFilters() {
    setYear('')
    setCategory('')
    setStatus('')
    setStats(initialStats)
  }

  const hasFilters = year || category || status

  return (
    <>
      <Card className="mb-8">
        <div className="flex gap-4 flex-wrap items-end">
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest mb-1 block">Ano</label>
            <select value={year} onChange={e => setYear(e.target.value)}
              className="border-4 border-brutalist-black bg-white p-3 font-bold uppercase text-xs">
              <option value="">TODOS</option>
              {availableYears.toReversed().map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest mb-1 block">Categoria</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="border-4 border-brutalist-black bg-white p-3 font-bold uppercase text-xs">
              <option value="">TODAS</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 pb-1">
            <span className="text-[9px] font-black uppercase tracking-widest">Situação:</span>
            {['', 'Ativo', 'Inativo'].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest border-4 transition-all ${status === s ? 'bg-brutalist-black text-neon-yellow border-brutalist-black' : 'bg-white text-brutalist-black border-brutalist-black hover:bg-neon-yellow'}`}>
                {s || 'TODOS'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={applyFilters} disabled={loading || !hasFilters}
              className="border-4 border-brutalist-black bg-brutalist-black text-neon-yellow px-6 py-3 font-black uppercase text-xs tracking-widest hover:opacity-90 disabled:opacity-50">
              {loading ? 'FILTRANDO...' : 'FILTRAR'}
            </button>
            {hasFilters && (
              <button onClick={resetFilters}
                className="border-4 border-brutalist-black bg-white px-6 py-3 font-black uppercase text-xs tracking-widest hover:bg-neon-yellow">
                LIMPAR
              </button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-4 gap-8">
        <Card>
          <p className="text-[10px] font-black uppercase tracking-widest text-brutalist-black mb-2">TOTAL</p>
          <p className="text-5xl font-black tracking-tighter text-brutalist-black">{stats.totalMedicines.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-black uppercase tracking-widest text-brutalist-black mb-2">MEDICAMENTOS DISTINTOS</p>
          <p className="text-5xl font-black tracking-tighter text-brutalist-black">{stats.totalReferences.toLocaleString()}</p>
        </Card>
        <Card variant="active">
          <p className="text-[10px] font-black uppercase tracking-widest text-brutalist-black mb-2">ATIVOS</p>
          <p className="text-5xl font-black tracking-tighter text-success-green">{stats.ativoCount.toLocaleString()}</p>
        </Card>
        <Card variant="inactive">
          <p className="text-[10px] font-black uppercase tracking-widest text-brutalist-black mb-2">INATIVOS</p>
          <p className="text-5xl font-black tracking-tighter text-error-red">{stats.inativoCount.toLocaleString()}</p>
        </Card>
      </div>

      {hasFilters && (
        <div className="bg-brutalist-black text-neon-yellow border-4 border-brutalist-black p-4 mt-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-center">
            {stats.totalMedicines} medicamentos encontrados com os filtros aplicados
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8 mt-8">
        <div className="border-4 border-brutalist-black bg-white shadow-hard-lg p-8">
          <Badge variant="secondary" className="mb-4">TOP 10 MEDICAMENTOS</Badge>
          <div className="space-y-2">
            {stats.topReferences.map((item, i) => {
              const maxCount = stats.topReferences[0]?.count || 1
              const width = (item.count / maxCount) * 100
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-xs font-bold uppercase mb-1">
                    <span className="truncate mr-2">{item.name}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-6 border-2 border-brutalist-black bg-white">
                    <div className="h-full bg-neon-yellow border-r-2 border-brutalist-black" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-4 border-brutalist-black bg-white shadow-hard-lg p-8">
          <Badge variant="secondary" className="mb-4">TOP 10 PRINCÍPIOS ATIVOS</Badge>
          <div className="space-y-2">
            {stats.topActiveIngredients.map((item, i) => {
              const maxCount = stats.topActiveIngredients[0]?.count || 1
              const width = (item.count / maxCount) * 100
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-xs font-bold uppercase mb-1">
                    <span className="truncate mr-2">{item.name}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-6 border-2 border-brutalist-black bg-white">
                    <div className="h-full bg-brutalist-black border-r-2 border-brutalist-black" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-4 border-brutalist-black bg-white shadow-hard-lg p-8">
          <Badge variant="secondary" className="mb-4">CATEGORIAS</Badge>
          <div className="space-y-2">
            {stats.categories.map((item, i) => {
              const maxCount = stats.categories[0]?.count || 1
              const width = (item.count / maxCount) * 100
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-xs font-bold uppercase mb-1">
                    <span className="truncate mr-2">{item.name || 'Sem categoria'}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-6 border-2 border-brutalist-black bg-white">
                    <div className="h-full bg-neon-yellow border-r-2 border-brutalist-black" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="border-4 border-brutalist-black bg-white shadow-hard-lg p-8 mt-8">
        <Badge variant="secondary" className="mb-4">TIMELINE — REGISTROS POR ANO</Badge>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {stats.timeline.map((item, i) => {
            const maxCount = stats.timeline[0]?.count || 1
            const width = (item.count / maxCount) * 100
            return (
              <div key={item.year}>
                <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                  <span>{item.year}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-4 border-2 border-brutalist-black bg-white">
                  <div className="h-full bg-brutalist-black" style={{ width: `${width}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
