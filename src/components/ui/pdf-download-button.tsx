'use client'

import { useState } from 'react'
import { generateMedicinePdf } from '@/lib/actions/pdf-report'

export function PdfDownloadButton({ medicineId }: { medicineId: number }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function handleDownload() {
    setLoading(true)
    setError(false)
    try {
      const buffer = await generateMedicinePdf(medicineId)
      const blob = new Blob([new Uint8Array(buffer)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `medicamento-${medicineId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-2 border border-border rounded-sm bg-[var(--color-bg)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-50"
      >
        {loading ? 'Gerando...' : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Baixar PDF
          </>
        )}
      </button>
      {error && (
        <span className="text-xs text-error font-medium" role="alert">
          Erro ao gerar PDF
        </span>
      )}
    </div>
  )
}
