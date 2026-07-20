import type { ImportInfo } from '@/types'

export function ImportStats({ info }: { info: ImportInfo | null }) {
  return (
    <div className="border border-border rounded-sm p-4 bg-[var(--color-bg)] space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-muted">Total</span>
        <span className="text-2xl font-black text-[var(--color-text)]">{info?.total ?? 0}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-muted">Última sincronização</span>
        <span className="text-sm font-medium text-[var(--color-text)]">
          {info?.lastImport ? new Date(info.lastImport).toLocaleString('pt-BR') : 'Nunca'}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-muted">Arquivo ANVISA</span>
        <span className="text-sm font-medium text-[var(--color-text)]">
          {info?.anvisaFileDate ? new Date(info.anvisaFileDate).toLocaleString('pt-BR') : '---'}
        </span>
      </div>
    </div>
  )
}
