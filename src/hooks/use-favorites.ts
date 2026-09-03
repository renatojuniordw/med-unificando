'use client'

import { useState, useCallback, useEffect } from 'react'
import { STORAGE_KEYS } from '@/lib/constants'
import { loadFromStorage, saveToStorage } from '@/lib/storage'

const FAVORITES_READ_ERROR = 'Falha ao ler favoritos do localStorage'
const FAVORITES_WRITE_ERROR = 'Falha ao salvar favoritos no localStorage'

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setFavorites(loadFromStorage<number[]>(STORAGE_KEYS.FAVORITES, FAVORITES_READ_ERROR) ?? [])
    setLoaded(true)
  }, [])

  const toggle = useCallback((id: number) => {
    setFavorites(prev => {
      const next = prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
      saveToStorage(STORAGE_KEYS.FAVORITES, next, FAVORITES_WRITE_ERROR)
      return next
    })
  }, [])

  const isFavorite = useCallback((id: number) => favorites.includes(id), [favorites])

  return { favorites: loaded ? favorites : [], toggle, isFavorite }
}