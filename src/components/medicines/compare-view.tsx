'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getMedicinesByIds, searchMedicinesForCompare } from '@/lib/actions/compare'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import type { MedicineResult } from '@/types'

const detailFields = [
  { key: 'reference', label: 'REFERÊNCIA' },
  { key: 'activeIngredient', label: 'PRINCÍPIO ATIVO' },
  { key: 'tradeName', label: 'NOME COMERCIAL' },
  { key: 'similarHolder', label: 'DETENTOR DO REGISTRO' },
  { key: 'category', label: 'CATEGORIA' },
  { key: 'referenceMedicine', label: 'MEDICAMENTO REFERÊNCIA' },
  { key: 'pharmaceuticalForm', label: 'FORMA FARMACÊUTICA' },
  { key: 'concentration', label: 'CONCENTRAÇÃO' },
  { key: 'atcCode', label: 'CÓDIGO ATC' },
  { key: 'prescriptionType', label: 'TARJA' },
  { key: 'status', label: 'SITUAÇÃO' },
  { key: 'authorization', label: 'AUTORIZAÇÃO' },
  { key: 'presentationCount', label: 'APRESENTAÇÕES' },
  { key: 'synonyms', label: 'SINÔNIMOS' },
  { key: 'indications', label: 'INDICAÇÕES' },
  { key: 'inclusionDate', label: 'DATA DE INCLUSÃO' },
]

export function CompareView() {
  const searchParams = useSearchParams()
  const ids = searchParams.get('ids')?.split(',').map(Number).filter(Boolean) || []

  const [medicines, setMedicines] = useState<MedicineResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<number[]>(ids)
  const { query: searchQuery, setQuery: setSearchQuery, results: searchResults } =
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
      setSelectedIds((prev) => [...prev, id])
      setSearchQuery('')
    }
  }

  function removeMedicine(id: number) {
    setSelectedIds((prev) => prev.filter((i) => i !== id))
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="mb-10">
        <Badge variant="secondary" className="mb-4">
          COMPARAÇÃO
        </Badge>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-brutalist-black mb-4">
          Comparar Medicamentos
        </h1>
        <Link
          href="/"
          className="text-xs font-mono font-bold uppercase text-brutalist-black underline hover:bg-brutalist-black hover:text-neon-yellow px-2 py-1 transition-colors"
        >
          ← VOLTAR PARA BUSCA
        </Link>
      </div>

      <Card className="mb-10">
        <div className="relative">
          <Input
            label="ADICIONAR MEDICAMENTO PARA COMPARAÇÃO"
            placeholder="Digite referência, princípio ativo ou nome comercial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full bg-white border-4 border-brutalist-black shadow-hard-md mt-1">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="block w-full text-left px-4 py-3 font-medium text-sm hover:bg-neon-yellow hover:text-brutalist-black transition-colors border-b-2 border-brutalist-black last:border-b-0"
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
                  className="inline-flex items-center gap-2 bg-brutalist-black text-neon-yellow font-black uppercase text-[10px] tracking-widest px-3 py-1 border-2 border-brutalist-black"
                >
                  {med?.tradeName || `ID ${id}`}
                  <button
                    onClick={() => removeMedicine(id)}
                    className="text-white hover:text-error-red ml-1"
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
          <p className="font-black uppercase tracking-wider text-lg text-brutalist-black animate-pulse">
            CARREGANDO...
          </p>
        </div>
      ) : medicines.length === 0 ? (
        <div className="text-center py-12 bg-white border-8 border-brutalist-black shadow-hard-lg">
          <p className="font-black uppercase tracking-wider text-lg text-brutalist-black">
            NENHUM MEDICAMENTO SELECIONADO
          </p>
          <p className="text-sm font-mono uppercase text-slate-500 mt-2">
            Use a busca acima para adicionar medicamentos à comparação
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border-8 border-brutalist-black bg-white shadow-hard-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-brutalist-black text-neon-yellow">
                <th className="text-left p-4 font-black uppercase tracking-wider text-xs border-r-4 border-neon-yellow w-48">
                  CAMPO
                </th>
                {medicines.map((med) => (
                  <th
                    key={med.id}
                    className="text-left p-4 font-black uppercase tracking-wider text-xs border-r-4 border-neon-yellow last:border-r-0"
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
                    className={`border-t-4 border-brutalist-black ${
                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    <td className="p-4 text-sm font-black uppercase border-r-4 border-brutalist-black bg-slate-100">
                      {field.label}
                    </td>
                    {medicines.map((med) => (
                      <td
                        key={`${med.id}-${field.key}`}
                        className={`p-4 text-sm font-bold uppercase border-r-4 border-brutalist-black last:border-r-0 ${
                          isDifferent ? 'bg-neon-yellow/30' : ''
                        }`}
                      >
                        {(med as unknown as Record<string, string>)[field.key]}
                        {isDifferent && (
                          <span className="ml-2 text-[9px] font-black text-brutalist-black bg-neon-yellow px-1">
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
