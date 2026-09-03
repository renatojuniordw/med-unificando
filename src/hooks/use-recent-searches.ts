'use client'

import { useState, useCallback, useEffect } from 'react'
import { STORAGE_KEYS } from '@/lib/constants'
import { loadFromStorage, saveToStorage } from '@/lib/storage'

const MAX_ITEMS = 5

const RECENT_READ_ERROR = 'Falha ao ler buscas recentes do localStorage'
const RECENT_WRITE_ERROR = 'Falha ao salvar buscas recentes no localStorage'

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setRecent(loadFromStorage<string[]>(STORAGE_KEYS.RECENT_SEARCHES, RECENT_READ_ERROR) ?? [])
    setLoaded(true)
  }, [])

  const add = useCallback((query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setRecent(prev => {
      const next = [trimmed, ...prev.filter(s => s !== trimmed)].slice(0, MAX_ITEMS)
      saveToStorage(STORAGE_KEYS.RECENT_SEARCHES, next, RECENT_WRITE_ERROR)
      return next
    })
  }, [])

  return { recent: loaded ? recent : [], add }
}