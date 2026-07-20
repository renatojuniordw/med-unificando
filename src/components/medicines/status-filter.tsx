'use client'

interface StatusFilterProps {
  value: string
  onChange: (value: string) => void
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-xs font-semibold text-muted">Situação:</span>
      {['', 'Ativo', 'Inativo'].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors ${
            value === s
              ? 'bg-brand-black text-white border-brand-black'
              : 'bg-[var(--color-bg)] text-muted border-border hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]'
          }`}
        >
          {s || 'Todos'}
        </button>
      ))}
    </div>
  )
}
