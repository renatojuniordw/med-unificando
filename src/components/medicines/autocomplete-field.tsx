'use client'

import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'

interface AutocompleteFieldProps {
  label: string
  placeholder?: string
  value: string
  options: { value: string }[]
  onChange: (value: string) => void
  onSelect: (value: string) => void
  fieldKey: string
}

export function AutocompleteField({
  label,
  placeholder,
  value,
  options,
  onChange,
  onSelect,
  fieldKey,
}: AutocompleteFieldProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange(val)
    if (val.length < 1) {
      setSuggestions([])
      return
    }
    const filtered = options
      .map(o => o.value)
      .filter(v => v.toLowerCase().includes(val.toLowerCase()))
      .slice(0, 8)
    setSuggestions(filtered)
  }, [onChange, options])

  const handleSelect = useCallback((item: string) => {
    onSelect(item)
    setSuggestions([])
  }, [onSelect])

  const handleBlur = useCallback(() => {
    setTimeout(() => setSuggestions([]), 200)
  }, [])

  const handleFocus = useCallback(() => {
    if (value) {
      const filtered = options
        .map(o => o.value)
        .filter(v => v.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 8)
      setSuggestions(filtered)
    }
  }, [value, options])

  return (
    <div className="relative">
      <Input
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        aria-autocomplete="list"
      />
      {suggestions.length > 0 && (
        <div
          className="absolute z-10 w-full bg-[var(--color-bg)] border border-border rounded-sm shadow-dropdown mt-1"
          role="listbox"
          aria-label={`Sugestões de ${fieldKey}`}
        >
          {suggestions.map((item, i) => (
            <button
              key={i}
              type="button"
              role="option"
              aria-selected={false}
              className="block w-full text-left px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-brand-yellow/10 transition-colors border-b border-border last:border-b-0"
              onMouseDown={() => handleSelect(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
