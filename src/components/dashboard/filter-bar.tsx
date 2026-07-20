interface FilterBarProps {
  availableYears: string[]
  categories: string[]
  year: string
  category: string
  status: string
  loading: boolean
  onYearChange: (year: string) => void
  onCategoryChange: (category: string) => void
  onStatusChange: (status: string) => void
  onApply: () => void
  onReset: () => void
}

export function FilterBar({
  availableYears,
  categories,
  year,
  category,
  status,
  loading,
  onYearChange,
  onCategoryChange,
  onStatusChange,
  onApply,
  onReset,
}: FilterBarProps) {
  const hasFilters = year || category || status

  return (
    <div className="flex gap-4 flex-wrap items-end">
      <div>
        <label className="text-xs font-semibold text-muted mb-1 block">Ano</label>
        <select value={year} onChange={e => onYearChange(e.target.value)}
          className="border border-border rounded-sm bg-[var(--color-bg)] p-2.5 text-sm text-[var(--color-text)]">
          <option value="">Todos</option>
          {[...availableYears].reverse().map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted mb-1 block">Categoria</label>
        <select value={category} onChange={e => onCategoryChange(e.target.value)}
          className="border border-border rounded-sm bg-[var(--color-bg)] p-2.5 text-sm text-[var(--color-text)]">
          <option value="">Todas</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2 pb-1">
        <span className="text-xs font-semibold text-muted">Situação:</span>
        {['', 'Ativo', 'Inativo'].map(s => (
          <button key={s} onClick={() => onStatusChange(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors ${status === s ? 'bg-brand-black text-white border-brand-black' : 'bg-[var(--color-bg)] text-muted border-border hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]'}`}>
            {s || 'Todos'}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onApply} disabled={loading || !hasFilters}
          className="bg-brand-black text-white px-5 py-2.5 text-xs font-semibold rounded-sm hover:bg-primary-light transition-colors disabled:opacity-50">
          {loading ? 'Filtrando...' : 'Filtrar'}
        </button>
        {hasFilters && (
          <button onClick={onReset}
            className="border border-border px-5 py-2.5 text-xs font-semibold rounded-sm text-muted hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors">
            Limpar
          </button>
        )}
      </div>
    </div>
  )
}
