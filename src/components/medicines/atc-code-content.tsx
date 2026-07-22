'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { getMedicinesByAtc } from '@/lib/actions/atc'
import { StatusPill } from '@/components/ui/status-pill'
import { Badge } from '@/components/ui/badge'
import { PaginationBar } from '@/components/ui/pagination'
import Link from 'next/link'
import type { MedicineResult, SearchResponse } from '@/types'

interface AtcCodeContentProps {
  code: string
  initialData: SearchResponse
}

// Computa breadcrumbs ATC a partir do código
function getAtcBreadcrumbs(code: string): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = []
  if (code.length >= 1) {
    crumbs.push({ label: code.substring(0, 1), href: `/atc/${code.substring(0, 1)}` })
  }
  if (code.length >= 3) {
    crumbs.push({ label: code.substring(0, 3), href: `/atc/${code.substring(0, 3)}` })
  }
  if (code.length >= 4) {
    crumbs.push({ label: code.substring(0, 4), href: `/atc/${code.substring(0, 4)}` })
  }
  crumbs.push({ label: code })
  return crumbs
}

const PAGE_SIZE = 20

export function AtcCodeContent({ code, initialData }: AtcCodeContentProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const page = Number(searchParams.get('page')) || 1

  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const latestKeyRef = useRef(0)

  useEffect(() => {
    const key = page
    latestKeyRef.current = key

    async function fetchData() {
      setLoading(true)
      try {
        const result = await getMedicinesByAtc(code, page, PAGE_SIZE)
        if (latestKeyRef.current === key) {
          setData(result as SearchResponse)
        }
      } catch {
        // silencia
      } finally {
        if (latestKeyRef.current === key) {
          setLoading(false)
        }
      }
    }

    if (page !== 1 || key !== 1) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [code, page])

  const totalPages = Math.ceil(data.total / data.pageSize)
  const ativos = data.data.filter((m: MedicineResult) => m.status === 'Ativo').length
  const inativos = data.total - ativos
  
  function handlePageChange(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`?${params.toString()}`)
  }

  const crumbs = getAtcBreadcrumbs(code)

  return (
    <section className="py-12 md:py-20 bg-[var(--color-bg)]">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        {/* Breadcrumbs ATC */}
        <nav className="flex items-center gap-1.5 text-xs text-muted mb-6 flex-wrap" aria-label="Hierarquia ATC">
          <Link href="/atc" className="hover:text-[var(--color-text)] underline transition-colors">
            ATC
          </Link>
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span>/</span>
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-[var(--color-text)] underline transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[var(--color-text)] font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        <div className="mt-8 mb-10">
          <Badge variant="primary" className="mb-4">Código ATC</Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--color-text)]">
            {code}
          </h1>
          <p className="mt-2 text-base text-muted">
            {data.total} medicamentos | {ativos} ativos, {inativos} inativos
          </p>
        </div>

        {/* Mobile: Cards */}
        <div className="space-y-3 md:hidden">
          {loading ? (
            <p className="text-sm text-muted text-center py-4">Carregando...</p>
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
                    <p className="text-xs text-muted mt-0.5">{med.activeIngredient}</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap shrink-0">
                    {med.category && (
                      <Badge variant="primary" className="text-[10px]">
                        {med.category}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted">{med.similarHolder}</span>
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
                <th className="text-left p-3 text-xs font-semibold text-muted">Detentor</th>
                <th className="text-left p-3 text-xs font-semibold text-muted">Categoria</th>
                <th className="text-center p-3 text-xs font-semibold text-muted">Situação</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((med: MedicineResult, i: number) => (
                <tr key={med.id} className={`border-b border-border ${i % 2 === 0 ? 'bg-[var(--color-bg)]' : 'bg-[var(--color-bg-secondary)]/50'} hover:bg-brand-yellow/5 transition-colors`}>
                  <td className="p-3 text-sm font-medium">
                    <Link href={`/medicamento/${med.id}`} className="text-[var(--color-text)] hover:underline">{med.tradeName}</Link>
                  </td>
                  <td className="p-3 text-sm text-[var(--color-text)]">{med.activeIngredient}</td>
                  <td className="p-3 text-sm text-muted">{med.similarHolder}</td>
                  <td className="p-3 text-sm text-[var(--color-text)]">{med.category}</td>
                  <td className="p-3 text-center text-sm font-medium">
                    {med.status ? <StatusPill status={med.status} /> : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {data.total > PAGE_SIZE && (
          <div className="mt-6">
            <PaginationBar
              page={page}
              totalPages={totalPages}
              total={data.total}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
              label="medicamento"
            />
          </div>
        )}
      </div>
    </section>
  )
}
