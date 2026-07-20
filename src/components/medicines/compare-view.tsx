'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { getMedicinesByIds, searchMedicinesForCompare } from '@/lib/actions/compare'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { MedicineResult } from '@/types'

const detailFields = [
  { key: 'reference', label: 'Referência' },
  { key: 'activeIngredient', label: 'Princípio Ativo' },
  { key: 'tradeName', label: 'Nome Comercial' },
  { key: 'similarHolder', label: 'Detentor do Registro' },
  { key: 'category', label: 'Categoria' },
  { key: 'referenceMedicine', label: 'Medicamento Referência' },
  { key: 'pharmaceuticalForm', label: 'Forma Farmacêutica' },
  { key: 'concentration', label: 'Concentração' },
  { key: 'atcCode', label: 'Código ATC' },
  { key: 'prescriptionType', label: 'Tarja' },
  { key: 'status', label: 'Situação' },
  { key: 'authorization', label: 'Autorização' },
  { key: 'presentationCount', label: 'Apresentações' },
  { key: 'synonyms', label: 'Sinônimos' },
  { key: 'indications', label: 'Indicações' },
  { key: 'inclusionDate', label: 'Data de Inclusão' },
]

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
        <div className="relative">
          <Input
            label="Adicionar medicamento para comparação"
            placeholder="Digite referência, princípio ativo ou nome comercial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searching && (
            <div className="absolute z-10 w-full bg-[var(--color-bg)] border border-border rounded-sm shadow-dropdown mt-1 p-3">
              <p className="text-sm text-muted">Buscando...</p>
            </div>
          )}
          {!searching && searchResults.length > 0 && (
            <div
              className="absolute z-10 w-full bg-[var(--color-bg)] border border-border rounded-sm shadow-dropdown mt-1"
              role="listbox"
              aria-label="Resultados da busca"
            >
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  className="block w-full text-left px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-brand-yellow/10 transition-colors border-b border-border last:border-b-0"
                  onClick={() => addMedicine(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {selectedIds.map((id) => {
              const med = medicines.find((m) => m.id === id)
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-2 bg-brand-yellow text-brand-black font-medium text-xs px-2.5 py-1 rounded-sm"
                >
                  {med?.tradeName || `ID ${id}`}
                  <button
                    onClick={() => removeMedicine(id)}
                    className="text-[var(--color-text)]/60 hover:text-error ml-0.5"
                    aria-label={`Remover ${med?.tradeName || id}`}
                  >
                    ✕
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="font-semibold text-lg text-[var(--color-text)] animate-pulse">
            Carregando...
          </p>
        </div>
      ) : medicines.length === 0 ? (
        <div className="text-center py-12 bg-[var(--color-bg)] border border-border rounded-md shadow-card">
          <p className="font-semibold text-lg text-[var(--color-text)]">
            Nenhum medicamento selecionado
          </p>
          <p className="text-sm text-muted mt-2">
            Use a busca acima para adicionar medicamentos à comparação
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-md bg-[var(--color-bg)] shadow-card">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--color-bg-secondary)] border-b border-border">
                <th className="text-left p-3 text-xs font-semibold text-muted w-48">
                  Campo
                </th>
                {medicines.map((med) => (
                  <th
                    key={med.id}
                    className="text-left p-3 text-xs font-semibold text-muted border-l border-border"
                  >
                    {med.tradeName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detailFields.map((field, rowIndex) => {
                const values = medicines.map(
                  (m) => (m as unknown as Record<string, string>)[field.key]
                )
                const isDifferent = values.some((v) => v !== values[0])
                return (
                  <tr
                    key={field.key}
                    className={`border-b border-border ${
                      rowIndex % 2 === 0 ? 'bg-[var(--color-bg)]' : 'bg-[var(--color-bg-secondary)]/50'
                    }`}
                  >
                    <td className="p-3 text-sm font-medium text-muted bg-[var(--color-bg-secondary)] border-r border-border">
                      {field.label}
                    </td>
                    {medicines.map((med) => (
                      <td
                        key={`${med.id}-${field.key}`}
                        className={`p-3 text-sm text-[var(--color-text)] border-l border-border ${
                          isDifferent ? 'bg-brand-yellow/10' : ''
                        }`}
                      >
                        {(med as unknown as Record<string, string>)[field.key]}
                        {isDifferent && (
                          <span className="ml-2 text-[10px] font-semibold text-brand-black bg-brand-yellow px-1 rounded-sm">
                            DIFERENTE
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
