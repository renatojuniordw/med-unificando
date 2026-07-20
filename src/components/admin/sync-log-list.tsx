import type { SyncLog } from '@/generated/prisma/client'

interface SyncLogListProps {
  logs: SyncLog[]
}

const TYPE_LABELS: Record<string, string> = {
  medicines: 'Medicamentos',
  prices: 'Preços',
  embeddings: 'Embeddings',
}

export function SyncLogList({ logs }: SyncLogListProps) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted">Nenhuma sincronização registrada ainda.</p>
  }

  return (
    <div className="space-y-2">
      {logs.map(log => (
        <div
          key={log.id}
          className="flex items-center justify-between gap-3 border border-border rounded-sm bg-[var(--color-bg)] p-3 flex-wrap"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${
                log.status === 'success'
                  ? 'bg-success/10 text-success'
                  : 'bg-error/10 text-error'
              }`}
            >
              {log.status === 'success' ? 'Sucesso' : 'Erro'}
            </span>
            <span className="text-sm font-medium text-[var(--color-text)]">{TYPE_LABELS[log.type] ?? log.type}</span>
            {log.status === 'success' && (
              <span className="text-sm text-muted">{log.count.toLocaleString()} registros</span>
            )}
            {log.message && (
              <span className="text-sm text-error truncate max-w-xs">{log.message}</span>
            )}
          </div>
          <span className="text-xs text-muted">
            {new Date(log.createdAt).toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  )
}
