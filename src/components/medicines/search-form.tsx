'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AutocompleteField } from '@/components/medicines/autocomplete-field'
import { StatusFilter } from '@/components/medicines/status-filter'
import { searchAutocomplete, countMedicines } from '@/lib/actions/search'

export function SearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('query') || '')
  const [reference, setReference] = useState(searchParams.get('reference') || '')
  const [activeIngredient, setActiveIngredient] = useState(searchParams.get('activeIngredient') || '')
  const [tradeName, setTradeName] = useState(searchParams.get('tradeName') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [pharmaceuticalForm, setPharmaceuticalForm] = useState(searchParams.get('pharmaceuticalForm') || '')
  const [similarHolder, setSimilarHolder] = useState(searchParams.get('similarHolder') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [farmaciaPopular, setFarmaciaPopular] = useState(searchParams.get('farmaciaPopular') === 'true')
  const [showExtra, setShowExtra] = useState(false)

  // Contagem estimada de resultados
  const [resultCount, setResultCount] = useState<number | null>(null)
  const countDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const countMountedRef = useRef(true)

  useEffect(() => {
    countMountedRef.current = true
    return () => { countMountedRef.current = false }
  }, [])

  useEffect(() => {
    if (countDebounceRef.current) clearTimeout(countDebounceRef.current)

    countDebounceRef.current = setTimeout(async () => {
      const filters = {
        query: query || undefined,
        reference: reference || undefined,
        activeIngredient: activeIngredient || undefined,
        tradeName: tradeName || undefined,
        category: category || undefined,
        pharmaceuticalForm: pharmaceuticalForm || undefined,
        similarHolder: similarHolder || undefined,
        status: status || undefined,
        farmaciaPopular: farmaciaPopular || undefined,
      }
      try {
        const count = await countMedicines(filters)
        if (countMountedRef.current) setResultCount(count)
      } catch {
        // Silencia erro da contagem
      }
    }, 600)

    return () => {
      if (countDebounceRef.current) clearTimeout(countDebounceRef.current)
    }
  }, [query, reference, activeIngredient, tradeName, category, pharmaceuticalForm, similarHolder, status, farmaciaPopular])

  // Fetchers memoizados para autocomplete server-side
  const fetchReference = useCallback((q: string) => searchAutocomplete('reference', q), [])
  const fetchIngredient = useCallback((q: string) => searchAutocomplete('activeIngredient', q), [])
  const fetchTradeName = useCallback((q: string) => searchAutocomplete('tradeName', q), [])
  const fetchCategory = useCallback((q: string) => searchAutocomplete('category', q), [])
  const fetchForm = useCallback((q: string) => searchAutocomplete('pharmaceuticalForm', q), [])
  const fetchHolder = useCallback((q: string) => searchAutocomplete('similarHolder', q), [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('query', query)
    if (reference) params.set('reference', reference)
    if (activeIngredient) params.set('activeIngredient', activeIngredient)
    if (tradeName) params.set('tradeName', tradeName)
    if (category) params.set('category', category)
    if (pharmaceuticalForm) params.set('pharmaceuticalForm', pharmaceuticalForm)
    if (similarHolder) params.set('similarHolder', similarHolder)
    if (status) params.set('status', status)
    if (farmaciaPopular) params.set('farmaciaPopular', 'true')
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  function handleReset() {
    setQuery('')
    setReference('')
    setActiveIngredient('')
    setTradeName('')
    setCategory('')
    setPharmaceuticalForm('')
    setSimilarHolder('')
    setStatus('')
    setFarmaciaPopular(false)
    setShowExtra(false)
    setResultCount(null)
    router.replace('/buscar-avancado')
  }

  function handleStatusChange(s: string) {
    setStatus(s)
    const params = new URLSearchParams(searchParams.toString())
    if (s) params.set('status', s)
    else params.delete('status')
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  function handleFarmaciaChange(checked: boolean) {
    setFarmaciaPopular(checked)
    const params = new URLSearchParams(searchParams.toString())
    if (checked) params.set('farmaciaPopular', 'true')
    else params.delete('farmaciaPopular')
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      {/* Busca textual — sempre visível */}
      <div className="mb-6">
        <Input
          label="Buscar por nome, princípio ativo ou referência"
          placeholder='Ex: "paracetamol", "dorflex", "losartana potássica"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Grid principal: 4 campos sempre visíveis */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <AutocompleteField
          label="Referência"
          placeholder="Digite o medicamento de referência..."
          value={reference}
          onChange={setReference}
          onSelect={setReference}
          fieldKey="reference"
          fetchSuggestions={fetchReference}
        />

        <AutocompleteField
          label="Princípio Ativo"
          placeholder="Digite o princípio ativo..."
          value={activeIngredient}
          onChange={setActiveIngredient}
          onSelect={setActiveIngredient}
          fieldKey="activeIngredient"
          fetchSuggestions={fetchIngredient}
        />

        <AutocompleteField
          label="Nome Comercial"
          placeholder="Digite o nome comercial..."
          value={tradeName}
          onChange={setTradeName}
          onSelect={setTradeName}
          fieldKey="tradeName"
          fetchSuggestions={fetchTradeName}
        />

        <AutocompleteField
          label="Categoria"
          placeholder="Digite a categoria..."
          value={category}
          onChange={setCategory}
          onSelect={setCategory}
          fieldKey="category"
          fetchSuggestions={fetchCategory}
        />
      </div>

      {/* Filtros extras: colapsável no mobile, sempre visível no desktop */}
      <div className="block">
        {/* Botão toggle mobile */}
        <button
          type="button"
          onClick={() => setShowExtra(prev => !prev)}
          className="md:hidden text-xs font-medium text-[var(--color-brand)] hover:underline mb-4 flex items-center gap-1"
        >
          {showExtra ? (
            <>▲ Ocultar filtros avançados</>
          ) : (
            <>▼ Forma farmacêutica, Detentor e outros</>
          )}
        </button>

        {/* Grid extra: 2 colunas no desktop, toggle no mobile */}
        <div className={`grid md:grid-cols-2 gap-4 mb-6 ${showExtra ? '' : 'max-md:hidden'}`}>
          <AutocompleteField
            label="Forma Farmacêutica"
            placeholder="Ex: comprimido, solução, pomada..."
            value={pharmaceuticalForm}
            onChange={setPharmaceuticalForm}
            onSelect={setPharmaceuticalForm}
            fieldKey="pharmaceuticalForm"
            fetchSuggestions={fetchForm}
          />

          <AutocompleteField
            label="Detentor"
            placeholder="Laboratório ou detentor do registro..."
            value={similarHolder}
            onChange={setSimilarHolder}
            onSelect={setSimilarHolder}
            fieldKey="similarHolder"
            fetchSuggestions={fetchHolder}
          />
        </div>
      </div>

      <StatusFilter value={status} onChange={handleStatusChange} />

      <label className="flex items-center gap-2 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={farmaciaPopular}
          onChange={(e) => handleFarmaciaChange(e.target.checked)}
          className="w-4 h-4 rounded border-border accent-brand-yellow"
        />
        <span className="text-sm font-medium text-[var(--color-text)]">
          Disponível na Farmácia Popular
        </span>
      </label>

      <div className="flex items-center gap-3 flex-wrap">
        <Button type="submit" variant="primary">
          Filtrar
        </Button>
        <Button type="button" variant="ghost" onClick={handleReset}>
          Limpar
        </Button>

        {/* Contagem de resultados */}
        {resultCount !== null && (
          <span className="text-xs text-muted/70 ml-auto">
            {resultCount.toLocaleString('pt-BR')} resultado{resultCount !== 1 ? 's' : ''} encontrado{resultCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </form>
  )
}
