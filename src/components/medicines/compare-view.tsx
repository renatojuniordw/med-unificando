'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { getMedicinesByIds, searchMedicinesForCompare } from '@/lib/actions/compare'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CompareSearch } from '@/components/medicines/compare-search'
import { SelectedTags } from '@/components/medicines/selected-tags'
import { CompareTable } from '@/components/medicines/compare-table'
import Link from 'next/link'
import type { MedicineResult } from '@/types'

export function CompareView() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const ids = searchParams.get('ids')?.split(',').map(Number).filter(Boolean) || []

  const [medicines, setMedicines] = useState<MedicineResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<number[]>(ids)

  const syncUrl = useCallback((newIds: number[]) => {
    const params = new URLSearchParams()
    if (newIds.length > 0) params.set('ids', newIds.join(','))
    router.replace(`/compare?${params.toString()}`, { scroll: false })
  }, [router])
  const { query: searchQuery, setQuery: setSearchQuery, results: searchResults, searching } =
    useDebouncedSearch(searchMedicinesForCompare)

  useEffect(() => {
    async function fetchData() {
      if (selectedIds.length === 0) {
        setMedicines([])
        setLoading(false)
        return
      }
      setLoading(true)
      const data = await getMedicinesByIds(selectedIds)
      setMedicines(data)
      setLoading(false)
    }
    fetchData()
  }, [selectedIds])

  function addMedicine(id: number) {
    if (!selectedIds.includes(id)) {
      const next = [...selectedIds, id]
      setSelectedIds(next)
      syncUrl(next)
      setSearchQuery('')
    }
  }

  function removeMedicine(id: number) {
    const next = selectedIds.filter((i) => i !== id)
    setSelectedIds(next)
    syncUrl(next)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
      <div className="mb-10">
        <Badge variant="primary" className="mb-4">
          Comparação
        </Badge>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--color-text)] mb-4">
          Comparar Medicamentos
        </h1>
        <Link
          href="/buscar-avancado"
          className="text-sm text-muted hover:text-[var(--color-text)] underline transition-colors"
        >
          ← Voltar para busca
        </Link>
      </div>

      <Card className="mb-10">
        <CompareSearch
          query={searchQuery}
          onQueryChange={setSearchQuery}
          results={searchResults}
          searching={searching}
          onAdd={addMedicine}
        />
        <SelectedTags
          medicines={medicines}
          selectedIds={selectedIds}
          onRemove={removeMedicine}
        />
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="font-semibold text-lg text-[var(--color-text)] animate-pulse">
            Carregando...
          </p>
        </div>
      ) : (
        <CompareTable medicines={medicines} />
      )}
    </div>
  )
}
