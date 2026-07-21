'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AutocompleteField } from '@/components/medicines/autocomplete-field'
import { StatusFilter } from '@/components/medicines/status-filter'

interface SearchFormProps {
  references: { value: string }[]
  activeIngredients: { value: string }[]
  tradeNames: { value: string }[]
  categories?: { value: string }[]
}

export function SearchForm({ references, activeIngredients, tradeNames, categories }: SearchFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [reference, setReference] = useState(searchParams.get('reference') || '')
  const [activeIngredient, setActiveIngredient] = useState(searchParams.get('activeIngredient') || '')
  const [tradeName, setTradeName] = useState(searchParams.get('tradeName') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [farmaciaPopular, setFarmaciaPopular] = useState(searchParams.get('farmaciaPopular') === 'true')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (reference) params.set('reference', reference)
    if (activeIngredient) params.set('activeIngredient', activeIngredient)
    if (tradeName) params.set('tradeName', tradeName)
    if (category) params.set('category', category)
    if (status) params.set('status', status)
    if (farmaciaPopular) params.set('farmaciaPopular', 'true')
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  function handleReset() {
    setReference('')
    setActiveIngredient('')
    setTradeName('')
    setCategory('')
    setStatus('')
    setFarmaciaPopular(false)
    router.push('/buscar-avancado')
  }

  function handleStatusChange(s: string) {
    setStatus(s)
    const params = new URLSearchParams(searchParams.toString())
    if (s) params.set('status', s)
    else params.delete('status')
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <AutocompleteField
          label="Referência"
          placeholder="Digite o medicamento de referência..."
          value={reference}
          options={references}
          onChange={setReference}
          onSelect={setReference}
          fieldKey="reference"
        />

        <AutocompleteField
          label="Princípio Ativo"
          placeholder="Digite o princípio ativo..."
          value={activeIngredient}
          options={activeIngredients}
          onChange={setActiveIngredient}
          onSelect={setActiveIngredient}
          fieldKey="activeIngredient"
        />

        <AutocompleteField
          label="Nome Comercial"
          placeholder="Digite o nome comercial..."
          value={tradeName}
          options={tradeNames}
          onChange={setTradeName}
          onSelect={setTradeName}
          fieldKey="tradeName"
        />

        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">
            Categoria
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-border rounded-sm px-3 py-2.5 min-h-[44px] text-sm text-[var(--color-text)] bg-[var(--color-bg)]"
          >
            <option value="">Todas</option>
            {categories?.map(c => (
              <option key={c.value} value={c.value}>{c.value}</option>
            ))}
          </select>
        </div>
      </div>

      <StatusFilter value={status} onChange={handleStatusChange} />

      <label className="flex items-center gap-2 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={farmaciaPopular}
          onChange={(e) => {
            setFarmaciaPopular(e.target.checked)
            const params = new URLSearchParams(searchParams.toString())
            if (e.target.checked) params.set('farmaciaPopular', 'true')
            else params.delete('farmaciaPopular')
            params.set('page', '1')
            router.push(`?${params.toString()}`)
          }}
          className="w-4 h-4 rounded border-border accent-brand-yellow"
        />
        <span className="text-sm font-medium text-[var(--color-text)]">
          Disponível na Farmácia Popular
        </span>
      </label>

      <div className="flex gap-3">
        <Button type="submit" variant="primary">
          Filtrar
        </Button>
        <Button type="button" variant="ghost" onClick={handleReset}>
          Limpar
        </Button>
      </div>
    </form>
  )
}
