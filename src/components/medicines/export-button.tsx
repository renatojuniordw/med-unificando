'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { exportToExcel, exportToCsv } from '@/lib/actions/export-action'
import type { SearchFilters } from '@/types'

interface ExportButtonProps {
  filters?: SearchFilters
}

export function ExportButton({ filters }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport(format: 'xlsx' | 'csv') {
    setLoading(true)
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
    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        disabled={loading}
        onClick={() => handleExport('xlsx')}
      >
        {loading ? 'EXPORTANDO...' : 'EXCEL'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={loading}
        onClick={() => handleExport('csv')}
      >
        CSV
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
