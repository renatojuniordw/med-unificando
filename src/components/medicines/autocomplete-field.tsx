'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAutocomplete } from '@/hooks/use-autocomplete'
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
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastQueryRef = useRef('')
  const { activeIndex, setActiveIndex, containerRef, inputRef, handleKeyDown } = useAutocomplete({
    itemCount: suggestions.length,
    onSelect: (index) => handleSelect(suggestions[index]),
  })

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
    setActiveIndex(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    inputRef.current?.focus()
  }, [onSelect, setActiveIndex, inputRef])

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
        aria-label={label ? undefined : placeholder}
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
