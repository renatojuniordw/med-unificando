import type { MedicineResult } from '@/types'

interface SelectedTagsProps {
  medicines: MedicineResult[]
  selectedIds: number[]
  onRemove: (id: number) => void
}

export function SelectedTags({ medicines, selectedIds, onRemove }: SelectedTagsProps) {
  if (selectedIds.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {selectedIds.map((id) => {
        const med = medicines.find((m) => m.id === id)
        return (
          <span
            key={id}
            className="inline-flex items-center gap-2 bg-brand-yellow text-brand-black font-medium text-xs px-2.5 py-1 rounded-sm"
          >
            {med?.tradeName || `ID ${id}`}
            <button
              onClick={() => onRemove(id)}
              className="text-[var(--color-text)]/60 hover:text-error ml-0.5"
              aria-label={`Remover ${med?.tradeName || id}`}
            >
              ✕
            </button>
          </span>
        )
      })}
    </div>
  )
}
