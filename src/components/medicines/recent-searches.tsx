interface RecentSearchesProps {
  searches: string[]
  onSelect: (query: string) => void
}

export function RecentSearches({ searches, onSelect }: RecentSearchesProps) {
  if (searches.length === 0) return null

  return (
    <div className="mt-4">
      <p className="text-xs text-[var(--color-text-secondary)] mb-2">Buscas recentes:</p>
      <div className="flex flex-wrap gap-2">
        {searches.map((r, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(r)}
            className="text-xs px-2.5 py-1 rounded-sm border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  )
}
