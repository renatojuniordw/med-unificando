// Helpers de persistência no localStorage (client-only).
// Centraliza o padrão guard-de-window + JSON.parse/setItem com try/catch,
// antes duplicado em use-favorites e use-recent-searches.

export function loadFromStorage<T>(key: string, warnMsg: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored) as T
  } catch {
    console.warn(warnMsg)
  }
  return null
}

export function saveToStorage(key: string, value: unknown, warnMsg: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.warn(warnMsg)
  }
}