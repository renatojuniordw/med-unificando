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

const CARD_FIELDS = [
  { key: 'reference', label: 'Ref' },
  { key: 'activeIngredient', label: 'Princípio Ativo' },
  { key: 'concentration', label: 'Concentração' },
  { key: 'similarHolder', label: 'Detentor' },
] as const

function MedicineCard({ medicine, selected, onToggle }: {
  medicine: MedicineResult
  selected: boolean
  onToggle: () => void
}) {
  return (
    <div className={`border border-border rounded-sm p-4 ${selected ? 'bg-brand-yellow/10 border-brand-yellow' : 'bg-[var(--color-bg)]'}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="accent-brand-yellow rounded-sm mt-1 shrink-0"
          aria-label={`Selecionar ${medicine.tradeName}`}
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/medicamento/${medicine.id}`}
            className="font-semibold text-sm text-[var(--color-text)] hover:underline"
          >
            {medicine.tradeName}
          </Link>
          <div className="mt-2 space-y-1">
            {CARD_FIELDS.map(f => {
              const value = String(medicine[f.key as keyof MedicineResult] ?? '')
              if (!value) return null
              return (
                <p key={f.key} className="text-xs text-muted">
                  <span className="font-medium text-[var(--color-text-secondary)]">{f.label}: </span>
                  {f.key === 'reference' ? (
                    <Link href={`/medicamento/${medicine.id}`} className="hover:underline">
                      {value}
                    </Link>
                  ) : value}
                </p>
              )
            })}
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {medicine.category && (
              <span className="bg-brand-yellow text-brand-black text-[10px] font-semibold px-1.5 py-0.5 rounded-sm">
                {medicine.category}
              </span>
            )}
            {medicine.status === 'Ativo' ? (
              <span className="text-[10px] font-medium text-success">Ativo</span>
            ) : medicine.status === 'Inativo' ? (
              <span className="text-[10px] font-medium text-error">Inativo</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
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
    <>
      {/* Mobile: Cards */}
      <div className="space-y-3 md:hidden">
        {data.map(medicine => (
          <MedicineCard
            key={medicine.id}
            medicine={medicine}
            selected={selectedIds.includes(medicine.id)}
            onToggle={() => toggleSelect(medicine.id)}
          />
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block overflow-x-auto">
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
      </div>
    </>
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
