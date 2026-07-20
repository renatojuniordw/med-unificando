'use client'

import { useState, useCallback } from 'react'
import { STORAGE_KEYS } from '@/lib/constants'

function loadFavorites(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES)
    if (stored) return JSON.parse(stored)
  } catch { console.warn('Falha ao ler favoritos do localStorage') }
  return []
}

function saveFavorites(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(ids))
  } catch { console.warn('Falha ao salvar favoritos no localStorage') }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>(loadFavorites)

  const toggle = useCallback((id: number) => {
    setFavorites(prev => {
      const next = prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
      saveFavorites(next)
      return next
    })
  }, [])

  const isFavorite = useCallback((id: number) => favorites.includes(id), [favorites])

  return { favorites, toggle, isFavorite }
}
