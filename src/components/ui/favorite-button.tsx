'use client'

import { useFavorites } from '@/hooks/use-favorites'
import { useToast } from '@/components/ui/toast'

export function FavoriteButton({ medicineId }: { medicineId: number }) {
  const { isFavorite, toggle } = useFavorites()
  const { toast } = useToast()
  const active = isFavorite(medicineId)

  function handleClick() {
    toggle(medicineId)
    toast(
      active ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
      'success'
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 border rounded-sm px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-yellow text-brand-black border-brand-yellow'
          : 'border-border bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]'
      }`}
      aria-label={active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
      {active ? 'Favoritado' : 'Favoritar'}
    </button>
  )
}
