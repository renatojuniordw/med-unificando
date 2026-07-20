'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
  const [suggestions, setSuggestions] = useState<{ field: string; items: string[] }>({ field: '', items: [] })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (reference) params.set('reference', reference)
    if (activeIngredient) params.set('activeIngredient', activeIngredient)
    if (tradeName) params.set('tradeName', tradeName)
    if (category) params.set('category', category)
    if (status) params.set('status', status)
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  function handleReset() {
    setReference('')
    setActiveIngredient('')
    setTradeName('')
    setCategory('')
    setStatus('')
    router.push('/buscar-avancado')
  }

  function handleAutocomplete(value: string, field: string, options: { value: string }[]) {
    if (value.length < 1) {
      setSuggestions({ field: '', items: [] })
      return
    }
    const filtered = options
      .map(o => o.value)
      .filter(v => v.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 8)
    setSuggestions({ field, items: filtered })
  }

  function selectSuggestion(value: string, field: string) {
    if (field === 'reference') setReference(value)
    else if (field === 'activeIngredient') setActiveIngredient(value)
    else if (field === 'tradeName') setTradeName(value)
    setSuggestions({ field: '', items: [] })
  }

  function renderAutocomplete(field: string) {
    if (suggestions.field !== field || suggestions.items.length === 0) return null
    return (
      <div
        className="absolute z-10 w-full bg-[var(--color-bg)] border border-border rounded-sm shadow-dropdown mt-1"
        role="listbox"
        aria-label={`Sugestões de ${field}`}
      >
        {suggestions.items.map((item, i) => (
          <button
            key={i}
            type="button"
            role="option"
            aria-selected={false}
            className="block w-full text-left px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-brand-yellow/10 transition-colors border-b border-border last:border-b-0"
            onMouseDown={() => selectSuggestion(item, field)}
          >
            {item}
          </button>
        ))}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Input
            label="Referência"
            placeholder="Digite o medicamento de referência..."
            value={reference}
            onChange={(e) => {
              setReference(e.target.value)
              handleAutocomplete(e.target.value, 'reference', references)
            }}
            onBlur={() => setTimeout(() => setSuggestions({ field: '', items: [] }), 200)}
            onFocus={() => reference && handleAutocomplete(reference, 'reference', references)}
            aria-autocomplete="list"
          />
          {renderAutocomplete('reference')}
        </div>

        <div className="relative">
          <Input
            label="Princípio Ativo"
            placeholder="Digite o princípio ativo..."
            value={activeIngredient}
            onChange={(e) => {
              setActiveIngredient(e.target.value)
              handleAutocomplete(e.target.value, 'activeIngredient', activeIngredients)
            }}
            onBlur={() => setTimeout(() => setSuggestions({ field: '', items: [] }), 200)}
            onFocus={() => activeIngredient && handleAutocomplete(activeIngredient, 'activeIngredient', activeIngredients)}
            aria-autocomplete="list"
          />
          {renderAutocomplete('activeIngredient')}
        </div>

        <div className="relative">
          <Input
            label="Nome Comercial"
            placeholder="Digite o nome comercial..."
            value={tradeName}
            onChange={(e) => {
              setTradeName(e.target.value)
              handleAutocomplete(e.target.value, 'tradeName', tradeNames)
            }}
            onBlur={() => setTimeout(() => setSuggestions({ field: '', items: [] }), 200)}
            onFocus={() => tradeName && handleAutocomplete(tradeName, 'tradeName', tradeNames)}
            aria-autocomplete="list"
          />
          {renderAutocomplete('tradeName')}
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">
            Categoria
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-border rounded-sm p-3 text-sm text-[var(--color-text)] bg-[var(--color-bg)]"
          >
            <option value="">Todas</option>
            {categories?.map(c => (
              <option key={c.value} value={c.value}>{c.value}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs font-semibold text-muted">Situação:</span>
        {['', 'Ativo', 'Inativo'].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setStatus(s)
              const params = new URLSearchParams(searchParams.toString())
              if (s) params.set('status', s)
              else params.delete('status')
              params.set('page', '1')
              router.push(`?${params.toString()}`)
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors ${
              status === s
                ? 'bg-brand-black text-white border-brand-black'
                : 'bg-[var(--color-bg)] text-muted border-border hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]'
            }`}
          >
            {s || 'Todos'}
          </button>
        ))}
      </div>

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
