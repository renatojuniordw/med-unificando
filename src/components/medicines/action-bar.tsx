import { PdfDownloadButton } from '@/components/ui/pdf-download-button'
import { FavoriteButton } from '@/components/ui/favorite-button'

export function ActionBar({ medicineId }: { medicineId: number }) {
  const bulaSearchUrl = 'https://consultas.anvisa.gov.br/#/medicamento/'

  return (
    <div className="flex gap-3 mb-8 flex-wrap items-center">
      <a
        href={bulaSearchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 border border-border rounded-sm bg-[var(--color-bg)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        Consultar na ANVISA
      </a>
      <PdfDownloadButton medicineId={medicineId} />
      <FavoriteButton medicineId={medicineId} />
    </div>
  )
}
