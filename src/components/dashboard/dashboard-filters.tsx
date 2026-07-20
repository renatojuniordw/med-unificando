'use client'

import { useState } from 'react'
import { getFilteredStats } from '@/lib/actions/search'
import { Card } from '@/components/ui/card'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { StatCards } from '@/components/dashboard/stat-cards'
import { ChartsSection } from '@/components/dashboard/charts-section'
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
        <FilterBar
          availableYears={availableYears}
          categories={categories}
          year={year}
          category={category}
          status={status}
          loading={loading}
          onYearChange={setYear}
          onCategoryChange={setCategory}
          onStatusChange={setStatus}
          onApply={applyFilters}
          onReset={resetFilters}
        />
      </Card>

      <StatCards stats={stats} />

      {hasFilters && (
        <div className="bg-brand-black text-white rounded-sm p-4 mt-6">
          <p className="text-xs font-semibold text-center">
            {stats.totalMedicines} medicamentos encontrados com os filtros aplicados
          </p>
        </div>
      )}

      <ChartsSection stats={stats} />
    </>
  )
}
