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
            <label className="text-xs font-semibold text-muted mb-1 block">Ano</label>
            <select value={year} onChange={e => setYear(e.target.value)}
              className="border border-border rounded-sm bg-[var(--color-bg)] p-2.5 text-sm text-[var(--color-text)]">
              <option value="">Todos</option>
              {[...availableYears].reverse().map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted mb-1 block">Categoria</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="border border-border rounded-sm bg-[var(--color-bg)] p-2.5 text-sm text-[var(--color-text)]">
              <option value="">Todas</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 pb-1">
            <span className="text-xs font-semibold text-muted">Situação:</span>
            {['', 'Ativo', 'Inativo'].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors ${status === s ? 'bg-brand-black text-white border-brand-black' : 'bg-[var(--color-bg)] text-muted border-border hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]'}`}>
                {s || 'Todos'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={applyFilters} disabled={loading || !hasFilters}
              className="bg-brand-black text-white px-5 py-2.5 text-xs font-semibold rounded-sm hover:bg-primary-light transition-colors disabled:opacity-50">
              {loading ? 'Filtrando...' : 'Filtrar'}
            </button>
            {hasFilters && (
              <button onClick={resetFilters}
                className="border border-border px-5 py-2.5 text-xs font-semibold rounded-sm text-muted hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors">
                Limpar
              </button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <p className="text-xs font-semibold text-muted mb-2">Total</p>
          <p className="text-4xl font-black tracking-tighter text-[var(--color-text)]">{stats.totalMedicines.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-muted mb-2">Medicamentos Distintos</p>
          <p className="text-4xl font-black tracking-tighter text-[var(--color-text)]">{stats.totalReferences.toLocaleString()}</p>
        </Card>
        <Card variant="active">
          <p className="text-xs font-semibold text-muted mb-2">Ativos</p>
          <p className="text-4xl font-black tracking-tighter text-success">{stats.ativoCount.toLocaleString()}</p>
        </Card>
        <Card variant="inactive">
          <p className="text-xs font-semibold text-muted mb-2">Inativos</p>
          <p className="text-4xl font-black tracking-tighter text-error">{stats.inativoCount.toLocaleString()}</p>
        </Card>
      </div>

      {hasFilters && (
        <div className="bg-brand-black text-white rounded-sm p-4 mt-6">
          <p className="text-xs font-semibold text-center">
            {stats.totalMedicines} medicamentos encontrados com os filtros aplicados
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="bg-[var(--color-bg)] border border-border rounded-md shadow-card p-6">
          <Badge variant="primary" className="mb-4">Top 10 Medicamentos</Badge>
          <div className="space-y-2">
            {stats.topReferences.map((item, i) => {
              const maxCount = stats.topReferences[0]?.count || 1
              const width = (item.count / maxCount) * 100
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-xs font-medium text-[var(--color-text)] mb-1">
                    <span className="truncate mr-2">{item.name}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-4 bg-[var(--color-bg-secondary)] rounded-sm overflow-hidden">
                    <div className="h-full bg-brand-yellow rounded-sm" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-[var(--color-bg)] border border-border rounded-md shadow-card p-6">
          <Badge variant="primary" className="mb-4">Top 10 Princípios Ativos</Badge>
          <div className="space-y-2">
            {stats.topActiveIngredients.map((item, i) => {
              const maxCount = stats.topActiveIngredients[0]?.count || 1
              const width = (item.count / maxCount) * 100
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-xs font-medium text-[var(--color-text)] mb-1">
                    <span className="truncate mr-2">{item.name}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-4 bg-[var(--color-bg-secondary)] rounded-sm overflow-hidden">
                    <div className="h-full bg-brand-black rounded-sm" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-[var(--color-bg)] border border-border rounded-md shadow-card p-6">
          <Badge variant="primary" className="mb-4">Categorias</Badge>
          <div className="space-y-2">
            {stats.categories.map((item, i) => {
              const maxCount = stats.categories[0]?.count || 1
              const width = (item.count / maxCount) * 100
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-xs font-medium text-[var(--color-text)] mb-1">
                    <span className="truncate mr-2">{item.name || 'Sem categoria'}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-4 bg-[var(--color-bg-secondary)] rounded-sm overflow-hidden">
                    <div className="h-full bg-brand-yellow rounded-sm" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-bg)] border border-border rounded-md shadow-card p-6 mt-8">
        <Badge variant="primary" className="mb-4">Timeline — Registros por Ano</Badge>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {stats.timeline.map((item, i) => {
            const maxCount = stats.timeline[0]?.count || 1
            const width = (item.count / maxCount) * 100
            return (
              <div key={item.year}>
                <div className="flex justify-between text-xs font-medium text-[var(--color-text)] mb-0.5">
                  <span>{item.year}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-3 bg-[var(--color-bg-secondary)] rounded-sm overflow-hidden">
                  <div className="h-full bg-brand-black rounded-sm" style={{ width: `${width}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
