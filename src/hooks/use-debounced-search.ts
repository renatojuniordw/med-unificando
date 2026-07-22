'use client'

import { useEffect, useRef, useState } from 'react'

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
  const latestQueryRef = useRef('')

  useEffect(() => {
    if (query.length < minLength) {
      setResolved({ query: '', results: [] })
      return
    }

    latestQueryRef.current = query

    const timer = setTimeout(async () => {
      try {
        const data = await searchFn(query)
        // Só atualiza se esta ainda for a query mais recente (evita race condition)
        if (latestQueryRef.current === query) {
          setResolved({ query, results: data })
        }
      } catch {
        if (latestQueryRef.current === query) {
          setResolved({ query, results: [] })
        }
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [query, minLength, delay, searchFn])

  const isQueryTooShort = query.length < minLength
  const results = isQueryTooShort ? [] : resolved.results
  const searching = !isQueryTooShort && resolved.query !== query

  return { query, setQuery, results, searching }
}
