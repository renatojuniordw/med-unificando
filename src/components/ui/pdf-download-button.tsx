'use client'

import { useState } from 'react'
import { generateMedicinePdf } from '@/lib/actions/pdf-report'

export function PdfDownloadButton({ medicineId }: { medicineId: number }) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
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
      alert('Erro ao gerar PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="inline-block border-4 border-brutalist-black bg-white px-6 py-3 font-black uppercase text-xs tracking-widest hover:bg-neon-yellow transition-colors disabled:opacity-50"
    >
      {loading ? 'GERANDO...' : '📥 BAIXAR PDF'}
    </button>
  )
}
