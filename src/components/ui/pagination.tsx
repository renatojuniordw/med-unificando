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
    <div className="flex items-center justify-between mt-6 pt-6 border-t-4 border-brutalist-black gap-4 flex-wrap">
      <div className="flex items-center gap-4">
        <span className="text-xs font-mono font-bold uppercase text-slate-500">
          {total} {label || 'registro'}{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border-2 border-brutalist-black bg-white p-1 text-[10px] font-bold uppercase"
          >
            <option value={10}>10/pág</option>
            <option value={25}>25/pág</option>
            <option value={50}>50/pág</option>
          </select>
        )}
      </div>
      <div className="flex gap-2 items-center">
        <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          ANTERIOR
        </Button>
        <span className="flex items-center px-2 text-sm font-black">
          {page} / {totalPages}
        </span>
        <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          PRÓXIMA
        </Button>
      </div>
    </div>
  )
}
