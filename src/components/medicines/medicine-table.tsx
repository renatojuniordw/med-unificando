'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { searchMedicines } from '@/lib/actions/search'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ExportButton } from '@/components/medicines/export-button'
import Link from 'next/link'
import type { MedicineResult, SearchResponse, SearchFilters } from '@/types'

export const columns = [
  { key: 'reference', label: 'Referência', mobile: true },
  { key: 'activeIngredient', label: 'Princípio Ativo', mobile: true },
  { key: 'tradeName', label: 'Nome Comercial', mobile: true },
  { key: 'similarHolder', label: 'Detentor', mobile: false },
  { key: 'category', label: 'Categoria', mobile: false },
  { key: 'status', label: 'Situação', mobile: false },
  { key: 'pharmaceuticalForm', label: 'Forma Farmacêutica', mobile: false },
  { key: 'concentration', label: 'Concentração', mobile: true },
  { key: 'inclusionDate', label: 'Inclusão', mobile: false },
]

interface MedicineTableProps {
  initialData: SearchResponse
}

export function MedicineTable({ initialData }: MedicineTableProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [data, setData] = useState<SearchResponse>(initialData)
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const reference = searchParams.get('reference') || ''
  const activeIngredient = searchParams.get('activeIngredient') || ''
  const tradeName = searchParams.get('tradeName') || ''
  const category = searchParams.get('category') || ''
  const status = searchParams.get('status') || ''

  const currentFilters: SearchFilters = useMemo(() => ({
    reference: reference || undefined,
    activeIngredient: activeIngredient || undefined,
    tradeName: tradeName || undefined,
    category: category || undefined,
    status: status || undefined,
  }), [reference, activeIngredient, tradeName, category, status])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const result = await searchMedicines(page, pageSize, currentFilters)
      setData(result)
      setLoading(false)
    }
    fetchData()
  }, [page, pageSize, currentFilters])

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    router.push(`?${params.toString()}`)
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  function handleCompare() {
    if (selectedIds.length >= 2) {
      router.push(`/compare?ids=${selectedIds.join(',')}`)
    }
  }

  const totalPages = Math.ceil(data.total / data.pageSize)

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {selectedIds.length >= 2 && (
            <Button variant="primary" size="sm" onClick={handleCompare}>
              Comparar ({selectedIds.length})
            </Button>
          )}
          {selectedIds.length > 0 && selectedIds.length < 2 && (
            <span className="text-xs text-muted">
              Selecione ao menos 2 medicamentos
            </span>
          )}
        </div>
        <ExportButton filters={currentFilters} />
      </div>

      <div className="overflow-x-auto border border-border rounded-md">
        {loading ? (
          <div className="p-6 space-y-4" aria-live="polite" aria-label="Carregando dados">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data.data.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-semibold text-lg text-[var(--color-text)]">
              Nenhum medicamento encontrado
            </p>
            <p className="text-sm text-muted mt-1">
              Tente ajustar os filtros da busca
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--color-bg-secondary)] border-b border-border">
                <th className="text-center p-3 text-xs font-semibold text-muted w-12">
                  #
                </th>
                {columns.filter(col => col.mobile).map((col) => (
                  <th
                    key={col.key}
                    className="text-left p-3 text-xs font-semibold text-muted"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((medicine: MedicineResult, index: number) => (
                <tr
                  key={medicine.id}
                  className={`border-b border-border hover:bg-brand-yellow/5 transition-colors ${
                    selectedIds.includes(medicine.id) ? 'bg-brand-yellow/10' : ''
                  }`}
                >
                  <td className="text-center p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(medicine.id)}
                      onChange={() => toggleSelect(medicine.id)}
                      className="accent-brand-yellow rounded-sm"
                      aria-label={`Selecionar ${medicine.tradeName}`}
                    />
                  </td>
                  {columns.filter(col => col.mobile).map((col) => {
                    const value = (medicine as unknown as Record<string, string>)[col.key]
                    const display = value ?? ''
                    if (col.key === 'tradeName' || col.key === 'reference') {
                      return (
                        <td key={col.key} className="p-3 text-sm font-medium">
                          <Link
                            href={`/medicamento/${medicine.id}`}
                            className="text-[var(--color-text)] hover:text-[var(--color-text)] hover:underline"
                          >
                            {display}
                          </Link>
                        </td>
                      )
                    }
                    return (
                      <td key={col.key} className="p-3 text-sm text-[var(--color-text)]">
                        {display}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data.total > 0 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">
              {data.total} medicamento{data.total !== 1 ? 's' : ''} encontrado{data.total !== 1 ? 's' : ''}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams.toString())
                params.set('pageSize', e.target.value)
                params.set('page', '1')
                router.push(`?${params.toString()}`)
              }}
              className="border border-border rounded-sm bg-[var(--color-bg)] p-1.5 text-xs text-[var(--color-text)]"
            >
              <option value={10}>10/pág</option>
              <option value={25}>25/pág</option>
              <option value={50}>50/pág</option>
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              aria-label="Página anterior"
            >
              Anterior
            </Button>
            <span className="px-2 text-sm font-medium text-[var(--color-text)]">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              aria-label="Próxima página"
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
