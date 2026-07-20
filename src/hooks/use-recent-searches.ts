'use client'

import { useState, useCallback } from 'react'
import { STORAGE_KEYS } from '@/lib/constants'

const MAX_ITEMS = 5

function loadRecent(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES)
    if (stored) return JSON.parse(stored)
  } catch { console.warn('Failed to read recent searches from localStorage') }
  return []
}

function saveRecent(items: string[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(items))
  } catch { console.warn('Failed to save recent searches to localStorage') }
}

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>(loadRecent)

  const add = useCallback((query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setRecent(prev => {
      const next = [trimmed, ...prev.filter(s => s !== trimmed)].slice(0, MAX_ITEMS)
      saveRecent(next)
      return next
    })
  }, [])

  return { recent, add }
}
