'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface AutocompleteFieldProps {
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onSelect: (value: string) => void
  fieldKey: string
  /** Fallback para filtragem client-side (usado quando não há fetchSuggestions) */
  options?: { value: string }[]
  /** Server-side autocomplete — recebe o termo digitado, retorna sugestões */
  fetchSuggestions?: (q: string) => Promise<{ value: string }[]>
}

export function AutocompleteField({
  label,
  placeholder,
  value,
  options,
  onChange,
  onSelect,
  fieldKey,
  fetchSuggestions,
}: AutocompleteFieldProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastQueryRef = useRef('')

  // Fechar autocomplete ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Reset activeIndex quando sugestões mudam
  useEffect(() => {
    setActiveIndex(-1)
  }, [suggestions.length])

  const filterClientSide = useCallback((val: string): string[] => {
    if (!options || val.length < 1) return []
    return options
      .map(o => o.value)
      .filter(v => v.toLowerCase().includes(val.toLowerCase()))
      .slice(0, 8)
  }, [options])

  const fetchServerSide = useCallback(async (val: string) => {
    if (!fetchSuggestions || val.length < 1) {
      setSuggestions([])
      return
    }
    const trimmed = val.trim()
    lastQueryRef.current = trimmed
    setLoading(true)
    try {
      const result = await fetchSuggestions(trimmed)
      // Ignora resposta obsoleta se um novo termo já foi digitado
      if (lastQueryRef.current === trimmed) {
        setSuggestions(result.map(r => r.value))
      }
    } catch {
      if (lastQueryRef.current === trimmed) {
        setSuggestions([])
      }
    } finally {
      if (lastQueryRef.current === trimmed) {
        setLoading(false)
      }
    }
  }, [fetchSuggestions])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange(val)

    // Cancela debounce anterior
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (fetchSuggestions) {
      // Server-side: debounce 200ms
      if (val.length < 1) {
        setSuggestions([])
        return
      }
      debounceRef.current = setTimeout(() => fetchServerSide(val), 200)
    } else {
      // Client-side: imediato
      setSuggestions(filterClientSide(val))
    }
  }, [onChange, fetchSuggestions, filterClientSide, fetchServerSide])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleSelect = useCallback((item: string) => {
    onSelect(item)
    setSuggestions([])
    if (debounceRef.current) clearTimeout(debounceRef.current)
    inputRef.current?.focus()
  }, [onSelect])

  const handleBlur = useCallback(() => {
    setTimeout(() => setSuggestions([]), 200)
  }, [])

  const handleFocus = useCallback(() => {
    if (value) {
      if (fetchSuggestions) {
        fetchServerSide(value)
      } else {
        setSuggestions(filterClientSide(value))
      }
    }
  }, [value, fetchSuggestions, filterClientSide, fetchServerSide])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0 && activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex])
      }
      return
    }

    if (suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setSuggestions([])
      setActiveIndex(-1)
    }
  }, [suggestions, activeIndex, handleSelect])

  return (
    <div className="relative" ref={containerRef}>
      <Input
        ref={inputRef}
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list"
        aria-expanded={suggestions.length > 0}
        aria-activedescendant={activeIndex >= 0 ? `autocomplete-${fieldKey}-${activeIndex}` : undefined}
        autoComplete="off"
      />
      {suggestions.length > 0 && (
        <div
          className="absolute z-10 w-full bg-[var(--color-bg)] border border-border rounded-sm shadow-dropdown mt-1 max-h-60 overflow-y-auto"
          role="listbox"
          aria-label={`Sugestões de ${fieldKey}`}
        >
          {loading && (
            <div className="px-4 py-2 text-xs text-muted border-b border-border">
              Buscando...
            </div>
          )}
          {suggestions.map((item, i) => (
            <button
              key={i}
              id={`autocomplete-${fieldKey}-${i}`}
              type="button"
              role="option"
              aria-selected={i === activeIndex}
              className={`block w-full text-left px-4 py-2.5 text-sm text-[var(--color-text)] border-b border-border last:border-b-0 transition-colors ${
                i === activeIndex
                  ? 'bg-brand-yellow/15'
                  : 'hover:bg-brand-yellow/10'
              }`}
              onMouseDown={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
