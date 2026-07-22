'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getHolderMedicines } from '@/lib/actions/search'
import { searchAutocomplete } from '@/lib/actions/search'
import { StatusFilter } from '@/components/medicines/status-filter'
import { AutocompleteField } from '@/components/medicines/autocomplete-field'
import { PaginationBar } from '@/components/ui/pagination'
import { StatusPill } from '@/components/ui/status-pill'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { MEDICINE_LIMITS } from '@/lib/constants'
import type { SearchResponse, MedicineResult } from '@/types'

interface HolderContentProps {
  holder: string
  initialData: SearchResponse
  totalMedicines: number
  ativos: number
  categoriasCount: number
}

const MOBILE_FIELDS: { key: keyof MedicineResult; label: string }[] = [
  { key: 'activeIngredient', label: 'Princípio Ativo' },
  { key: 'category', label: 'Categoria' },
]

export function HolderContent({ holder, initialData, totalMedicines, ativos, categoriasCount }: HolderContentProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const page = Number(searchParams.get('page')) || 1
  const q = searchParams.get('q') || ''
  const status = searchParams.get('status') || ''
  const pageSize = MEDICINE_LIMITS.HOLDER_PAGE_SIZE

  const [data, setData] = useState<SearchResponse>(initialData)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState(q)

  useEffect(() => {
    setSearchInput(q)
  }, [q])

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const result = await getHolderMedicines(
        holder,
        page,
        pageSize,
        q || undefined,
        status || undefined
      )
      setData(result)
      setLoading(false)
    }
    fetch()
  }, [holder, page, pageSize, q, status])

  const inativos = totalMedicines - ativos
  const currentTotal = data.total

  function handleSearch(value: string) {
    setSearchInput(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('q', value)
    else params.delete('q')
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  function handleStatusChange(s: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (s) params.set('status', s)
    else params.delete('status')
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  function handlePageChange(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`?${params.toString()}`)
  }

  const totalPages = Math.ceil(currentTotal / pageSize)

  return (
    <>
      {/* Cards de resumo visual */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <div className="border border-border rounded-sm p-3 bg-[var(--color-bg-secondary)]">
          <p className="text-xs text-muted">Total</p>
          <p className="text-xl font-bold text-[var(--color-text)]">{totalMedicines}</p>
        </div>
        <div className="border border-border rounded-sm p-3 bg-green-50/50 dark:bg-green-950/20">
          <p className="text-xs text-muted">Ativos</p>
          <p className="text-xl font-bold text-success">{ativos}</p>
        </div>
        <div className="border border-border rounded-sm p-3 bg-red-50/50 dark:bg-red-950/20">
          <p className="text-xs text-muted">Inativos</p>
          <p className="text-xl font-bold text-error">{inativos}</p>
        </div>
        <div className="border border-border rounded-sm p-3 bg-blue-50/50 dark:bg-blue-950/20">
          <p className="text-xs text-muted">Categorias</p>
          <p className="text-xl font-bold text-blue-600">{categoriasCount}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted">
        {currentTotal} medicamento{currentTotal !== 1 ? 's' : ''}
        {!q && !status ? ` | ${ativos} ativos | ${categoriasCount} categorias` : ''}
      </p>

      {/* Busca com AutocompleteField */}
      <div className="mt-4">
        <AutocompleteField
          label=""
          placeholder="Buscar por nome comercial ou princípio ativo..."
          value={searchInput}
          onChange={handleSearch}
          onSelect={handleSearch}
          fieldKey="holderSearch"
          fetchSuggestions={(query) => searchAutocomplete('tradeName', query)}
        />
      </div>

      <div className="mt-4">
        <StatusFilter value={status} onChange={handleStatusChange} />
      </div>

      {/* Mobile: Cards */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <p className="text-sm text-muted text-center py-4">Buscando...</p>
        ) : data.data.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">Nenhum medicamento encontrado</p>
        ) : (
          data.data.map((med: MedicineResult) => (
            <Link
              key={med.id}
              href={`/medicamento/${med.id}`}
              className="block border border-border rounded-sm bg-[var(--color-bg)] p-4 hover:bg-brand-yellow/10 hover:border-brand-yellow transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-sm text-[var(--color-text)] group-hover:text-[var(--color-brand)] transition-colors">
                    {med.tradeName}
                  </span>
                  {MOBILE_FIELDS.map(f => {
                    const value = String(med[f.key] ?? '')
                    if (!value) return null
                    return (
                      <p key={f.key} className="text-xs text-muted mt-0.5">
                        {value}
                      </p>
                    )
                  })}
                </div>
                <div className="flex gap-1.5 flex-wrap shrink-0">
                  {med.category && (
                    <Badge variant="primary" className="text-[10px]">
                      {med.category}
                    </Badge>
                  )}
                  {med.farmaciaPopular && (
                    <Badge variant="success" className="text-[10px]" title="Farmácia Popular">
                      FP
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {med.status && <StatusPill status={med.status} />}
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Desktop: Tabela */}
      <div className="hidden md:block border border-border rounded-md overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[var(--color-bg-secondary)] border-b border-border">
              <th className="text-left p-3 text-xs font-semibold text-muted">Nome Comercial</th>
              <th className="text-left p-3 text-xs font-semibold text-muted">Princípio Ativo</th>
              <th className="text-left p-3 text-xs font-semibold text-muted">Categoria</th>
              <th className="text-center p-3 text-xs font-semibold text-muted w-16" title="Farmácia Popular">FP</th>
              <th className="text-center p-3 text-xs font-semibold text-muted">Situação</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm text-muted">
                  Buscando...
                </td>
              </tr>
            ) : data.data.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm text-muted">
                  Nenhum medicamento encontrado
                </td>
              </tr>
            ) : (
              data.data.map((med: MedicineResult, i: number) => (
                <tr
                  key={med.id}
                  className={`border-b border-border ${i % 2 === 0 ? 'bg-[var(--color-bg)]' : 'bg-[var(--color-bg-secondary)]/50'} hover:bg-brand-yellow/5 transition-colors`}
                >
                  <td className="p-3 text-sm font-medium">
                    <Link href={`/medicamento/${med.id}`} className="text-[var(--color-text)] hover:underline">
                      {med.tradeName}
                    </Link>
                  </td>
                  <td className="p-3 text-sm text-[var(--color-text)]">{med.activeIngredient}</td>
                  <td className="p-3 text-sm text-[var(--color-text)]">{med.category}</td>
                  <td className="p-3 text-center">
                    {med.farmaciaPopular && <Badge variant="success" title="Farmácia Popular">FP</Badge>}
                  </td>
                  <td className="p-3 text-center text-sm font-medium">
                    {med.status ? <StatusPill status={med.status} /> : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <PaginationBar
          page={page}
          totalPages={totalPages}
          total={currentTotal}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          label="medicamento"
        />
      )}
    </>
  )
}
