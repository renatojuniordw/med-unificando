'use client'

import { Button } from '@/components/ui/button'

interface PaginationBarProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  label?: string
}

export function PaginationBar({ page, totalPages, total, pageSize, onPageChange, onPageSizeChange, label }: PaginationBarProps) {
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border gap-4 flex-wrap">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted">
          {total} {label || 'registro'}{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-border rounded-sm bg-[var(--color-bg)] p-1.5 text-xs text-[var(--color-text)]"
          >
            <option value={10}>10/pág</option>
            <option value={25}>25/pág</option>
            <option value={50}>50/pág</option>
          </select>
        )}
      </div>
      <div className="flex gap-2 items-center">
        <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Página anterior">
          Anterior
        </Button>
        <span className="px-2 text-sm font-medium text-[var(--color-text)]">
          {page} / {totalPages}
        </span>
        <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Próxima página">
          Próxima
        </Button>
      </div>
    </div>
  )
}
