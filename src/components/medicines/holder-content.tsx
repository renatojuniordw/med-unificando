'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getHolderMedicines } from '@/lib/actions/search'
import { StatusFilter } from '@/components/medicines/status-filter'
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

  const filteredAtivos = data.data.filter((m: MedicineResult) => m.status === 'Ativo').length
  const filteredInativos = data.data.filter((m: MedicineResult) => m.status === 'Inativo').length
  const currentTotal = data.total

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchInput) params.set('q', searchInput)
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
      <p className="mt-2 text-base text-muted">
        {currentTotal} medicamento{currentTotal !== 1 ? 's' : ''}
        {!q && !status ? ` | ${ativos} ativos | ${categoriasCount} categorias` : ''}
      </p>

      <form onSubmit={handleSearch} className="mt-6 flex gap-3">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nome comercial ou princípio ativo..."
          className="flex-1 border border-border rounded-sm px-3 py-2.5 min-h-[44px] text-sm text-[var(--color-text)] bg-[var(--color-bg)]"
        />
        <button
          type="submit"
          className="bg-brand-black text-white font-semibold rounded-sm px-6 min-h-[44px] text-sm transition-colors hover:bg-primary-light"
        >
          Buscar
        </button>
        {q && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('')
              const params = new URLSearchParams(searchParams.toString())
              params.delete('q')
              params.set('page', '1')
              router.push(`?${params.toString()}`)
            }}
            className="text-sm text-muted hover:text-[var(--color-text)] px-3 min-h-[44px]"
          >
            Limpar
          </button>
        )}
      </form>

      <StatusFilter value={status} onChange={handleStatusChange} />

      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[var(--color-bg-secondary)] border-b border-border">
              <th className="text-left p-3 text-xs font-semibold text-muted">Nome Comercial</th>
              <th className="text-left p-3 text-xs font-semibold text-muted">Princípio Ativo</th>
              <th className="text-left p-3 text-xs font-semibold text-muted">Categoria</th>
              <th className="text-center p-3 text-xs font-semibold text-muted w-16">FP</th>
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
                    {med.farmaciaPopular && <Badge variant="success">FP</Badge>}
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
