'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { searchMedicines } from '@/lib/actions/search'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ExportButton } from '@/components/medicines/export-button'
import Link from 'next/link'
import type { MedicineResult, SearchResponse, SearchFilters } from '@/types'

const columns = [
  { key: 'reference', label: 'REFERÊNCIA', mobile: true },
  { key: 'activeIngredient', label: 'PRINCÍPIO ATIVO', mobile: true },
  { key: 'tradeName', label: 'NOME COMERCIAL', mobile: true },
  { key: 'similarHolder', label: 'DETENTOR', mobile: false },
  { key: 'category', label: 'CATEGORIA', mobile: false },
  { key: 'status', label: 'SITUAÇÃO', mobile: false },
  { key: 'pharmaceuticalForm', label: 'FORMA FARMACÊUTICA', mobile: false },
  { key: 'concentration', label: 'CONCENTRAÇÃO', mobile: true },
  { key: 'inclusionDate', label: 'INCLUSÃO', mobile: false },
]

interface MedicineTableProps {
  initialData: SearchResponse
}

export function MedicineTable({ initialData }: MedicineTableProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [data, setData] = useState<SearchResponse>(initialData)
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const page = Number(searchParams.get('page')) || 1
  const reference = searchParams.get('reference') || ''
  const activeIngredient = searchParams.get('activeIngredient') || ''
  const tradeName = searchParams.get('tradeName') || ''
  const category = searchParams.get('category') || ''

  const currentFilters: SearchFilters = {
    reference: reference || undefined,
    activeIngredient: activeIngredient || undefined,
    tradeName: tradeName || undefined,
    category: category || undefined,
  }

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)

    async function fetchData() {
      setLoading(true)
      const result = await searchMedicines(page, 10, currentFilters)
      setData(result)
      setLoading(false)
    }
    fetchData()
  }, [page, reference, activeIngredient, tradeName, category])

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
  const visibleColumns = columns.filter(col => col.mobile || !isMobile)

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {selectedIds.length >= 2 && (
            <Button variant="primary" size="sm" onClick={handleCompare}>
              COMPARAR ({selectedIds.length})
            </Button>
          )}
          {selectedIds.length > 0 && selectedIds.length < 2 && (
            <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
              Selecione ao menos 2 medicamentos
            </span>
          )}
        </div>
        <ExportButton filters={currentFilters} />
      </div>

      <div className="overflow-x-auto border-4 border-brutalist-black">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data.data.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-black uppercase tracking-wider text-lg text-brutalist-black">
              NENHUM MEDICAMENTO ENCONTRADO
            </p>
            <p className="text-sm font-mono uppercase text-slate-500 mt-2">
              Tente ajustar os filtros da busca
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-brutalist-black text-neon-yellow">
                <th className="text-center p-4 font-black uppercase tracking-wider text-xs border-r-4 border-neon-yellow w-12">
                  #
                </th>
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    className={`text-left p-4 font-black uppercase tracking-wider text-xs border-r-4 border-neon-yellow last:border-r-0`}
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
                  className={`border-t-4 border-brutalist-black hover:bg-neon-yellow/20 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  } ${selectedIds.includes(medicine.id) ? 'bg-neon-yellow/40' : ''}`}
                >
                  <td className="text-center p-4 border-r-4 border-brutalist-black">
                    <button
                      type="button"
                      className={`w-6 h-6 border-2 border-brutalist-black flex items-center justify-center ${
                        selectedIds.includes(medicine.id)
                          ? 'bg-brutalist-black text-neon-yellow'
                          : 'bg-white'
                      }`}
                      onClick={() => toggleSelect(medicine.id)}
                    >
                      {selectedIds.includes(medicine.id) && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </td>
                  {visibleColumns.map((col) => {
                    const value = (medicine as unknown as Record<string, string>)[col.key]
                    const display = value ?? ''
                    if (col.key === 'tradeName' || col.key === 'reference') {
                      return (
                        <td key={col.key} className="p-4 text-sm font-bold uppercase">
                          <Link
                            href={`/medicamento/${medicine.id}`}
                            className="hover:bg-neon-yellow hover:text-brutalist-black transition-colors"
                          >
                            {display}
                          </Link>
                        </td>
                      )
                    }
                    return (
                      <td key={col.key} className="p-4 text-sm font-bold uppercase">
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
        <div className="flex items-center justify-between mt-6 pt-6 border-t-4 border-brutalist-black gap-4 flex-wrap">
          <span className="text-xs font-mono font-bold uppercase text-slate-500">
            {data.total} medicamento{data.total !== 1 ? 's' : ''} encontrado{data.total !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2 items-center">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              ANTERIOR
            </Button>
            <span className="flex items-center px-2 text-sm font-black">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              PRÓXIMA
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
