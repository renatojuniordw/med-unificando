'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { exportToExcel, exportToCsv } from '@/lib/actions/export-action'
import type { SearchFilters } from '@/types'

interface ExportButtonProps {
  filters?: SearchFilters
}

export function ExportButton({ filters }: ExportButtonProps) {
  const [loading, setLoading] = useState<'xlsx' | 'csv' | null>(null)

  async function handleExport(format: 'xlsx' | 'csv') {
    setLoading(format)
    try {
      if (format === 'xlsx') {
        const result = await exportToExcel(filters)
        const blob = new Blob([new Uint8Array(result.buffer)], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        downloadBlob(blob, result.filename)
      } else {
        const result = await exportToCsv(filters)
        const blob = new Blob([result.text], { type: 'text/csv;charset=utf-8' })
        downloadBlob(blob, result.filename)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
    setLoading(null)
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={loading !== null}
        onClick={() => handleExport('xlsx')}
      >
        {loading === 'xlsx' ? 'Exportando...' : 'Excel'}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={loading !== null}
        onClick={() => handleExport('csv')}
      >
        {loading === 'csv' ? 'Exportando...' : 'CSV'}
      </Button>
    </div>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
