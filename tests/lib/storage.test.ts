import { describe, it, expect, vi, afterEach } from 'vitest'
import { loadFromStorage, saveToStorage } from '@/lib/storage'

describe('loadFromStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('returns null when window is undefined (SSR)', () => {
    vi.stubGlobal('window', undefined)
    expect(loadFromStorage('k', 'warn')).toBeNull()
  })

  it('returns null for an absent key', () => {
    expect(loadFromStorage('absent-key', 'warn')).toBeNull()
  })

  it('parses stored JSON into the typed value', () => {
    localStorage.setItem('stored', JSON.stringify({ a: 1 }))
    expect(loadFromStorage('stored', 'warn')).toEqual({ a: 1 })
  })

  it('warns and returns null on invalid JSON', () => {
    localStorage.setItem('broken', '{not-json')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(loadFromStorage('broken', 'json inválido')).toBeNull()
    expect(warn).toHaveBeenCalledWith('json inválido')
  })
})

describe('saveToStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('is a no-op when window is undefined (SSR)', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    vi.stubGlobal('window', undefined)
    saveToStorage('k', { a: 1 }, 'warn')
    expect(setItem).not.toHaveBeenCalled()
  })

  it('writes JSON to localStorage', () => {
    saveToStorage('save-key', { x: 2 }, 'warn')
    expect(localStorage.getItem('save-key')).toBe(JSON.stringify({ x: 2 }))
  })

  it('warns without throwing when localStorage write fails', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota exceeded')
      })
    saveToStorage('k', 1, 'falhou ao salvar')
    expect(warn).toHaveBeenCalledWith('falhou ao salvar')
    setItem.mockRestore()
  })
})