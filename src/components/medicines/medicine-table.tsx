'use client'

import { useState } from 'react'
import { useMedicineSearch } from '@/lib/hooks/use-medicine-search'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { PaginationBar } from '@/components/ui/pagination'
import { ExportButton } from '@/components/medicines/export-button'
import Link from 'next/link'
import type { MedicineResult, SearchResponse } from '@/types'

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

function EmptyState() {
  return (
    <div className="p-12 text-center">
      <p className="font-semibold text-lg text-[var(--color-text)]">
        Nenhum medicamento encontrado
      </p>
      <p className="text-sm text-muted mt-1">
        Tente ajustar os filtros da busca
      </p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="p-6 space-y-4" aria-live="polite" aria-label="Carregando dados">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

function MedicineTableContent({ data, selectedIds, toggleSelect }: {
  data: MedicineResult[]
  selectedIds: number[]
  toggleSelect: (id: number) => void
}) {
  const mobileColumns = columns.filter(col => col.mobile)

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-[var(--color-bg-secondary)] border-b border-border">
          <th className="text-center p-3 text-xs font-semibold text-muted w-12">#</th>
          {mobileColumns.map((col) => (
            <th key={col.key} className="text-left p-3 text-xs font-semibold text-muted">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((medicine: MedicineResult) => (
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
            {mobileColumns.map((col) => {
              const value = String(medicine[col.key as keyof MedicineResult] ?? '')
              if (col.key === 'tradeName' || col.key === 'reference') {
                return (
                  <td key={col.key} className="p-3 text-sm font-medium">
                    <Link href={`/medicamento/${medicine.id}`} className="text-[var(--color-text)] hover:underline">
                      {value}
                    </Link>
                  </td>
                )
              }
              return (
                <td key={col.key} className="p-3 text-sm text-[var(--color-text)]">
                  {value}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function MedicineTable({ initialData }: MedicineTableProps) {
  const { data, loading, page, pageSize, currentFilters, totalPages, handlePageChange, handlePageSizeChange, router } = useMedicineSearch(initialData)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

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
          <LoadingState />
        ) : data.data.length === 0 ? (
          <EmptyState />
        ) : (
          <MedicineTableContent
            data={data.data}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
          />
        )}
      </div>

      {data.total > 0 && (
        <PaginationBar
          page={page}
          totalPages={totalPages}
          total={data.total}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          label="medicamento"
        />
      )}
    </div>
  )
}
