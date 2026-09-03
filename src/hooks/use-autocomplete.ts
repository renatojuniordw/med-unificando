'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface UseAutocompleteOptions {
  itemCount: number
  onSelect?: (index: number) => void
}

// Lógica comum de autocomplete: navegação por teclado (setas/Enter/Escape),
// reset do índice quando a lista muda e fechamento ao clicar fora.
export function useAutocomplete({ itemCount, onSelect }: UseAutocompleteOptions) {
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setActiveIndex(-1)
  }, [itemCount])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (itemCount > 0 && activeIndex >= 0) {
        onSelect?.(activeIndex)
        inputRef.current?.focus()
      }
      return
    }

    if (itemCount === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => prev < itemCount - 1 ? prev + 1 : 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => prev > 0 ? prev - 1 : itemCount - 1)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setActiveIndex(-1)
    }
  }, [itemCount, activeIndex, onSelect])

  return { activeIndex, setActiveIndex, containerRef, inputRef, handleKeyDown }
}