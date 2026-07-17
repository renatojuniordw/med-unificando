'use client'

import { useEffect, useState } from 'react'

interface UseDebouncedSearchOptions {
  minLength?: number
  delay?: number
}

export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  { minLength = 2, delay = 300 }: UseDebouncedSearchOptions = {}
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (query.length < minLength) {
      setResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    const timer = setTimeout(async () => {
      const data = await searchFn(query)
      setResults(data)
      setSearching(false)
    }, delay)

    return () => clearTimeout(timer)
  }, [query, minLength, delay, searchFn])

  return { query, setQuery, results, searching }
}
