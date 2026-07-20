'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'favorite-medicines'

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setFavorites(JSON.parse(stored))
    } catch { /* ignorar */ }
  }, [])

  const persist = useCallback((ids: number[]) => {
    setFavorites(ids)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  }, [])

  const toggle = useCallback((id: number) => {
    persist(
      favorites.includes(id)
        ? favorites.filter(i => i !== id)
        : [...favorites, id]
    )
  }, [favorites, persist])

  const isFavorite = useCallback((id: number) => favorites.includes(id), [favorites])

  return { favorites, toggle, isFavorite }
}
