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
  const [resolved, setResolved] = useState<{ query: string; results: T[] }>({ query: '', results: [] })

  useEffect(() => {
    if (query.length < minLength) return

    const timer = setTimeout(async () => {
      const data = await searchFn(query)
      setResolved({ query, results: data })
    }, delay)

    return () => clearTimeout(timer)
  }, [query, minLength, delay, searchFn])

  const isQueryTooShort = query.length < minLength
  const results = isQueryTooShort ? [] : resolved.results
  const searching = !isQueryTooShort && resolved.query !== query

  return { query, setQuery, results, searching }
}
