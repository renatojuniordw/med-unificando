import type { SyncLog } from '@/generated/prisma/client'

interface SyncLogListProps {
  logs: SyncLog[]
}

const TYPE_LABELS: Record<string, string> = {
  medicines: 'MEDICAMENTOS',
  prices: 'PREÇOS',
  embeddings: 'EMBEDDINGS',
}

export function SyncLogList({ logs }: SyncLogListProps) {
  if (logs.length === 0) {
    return <p className="font-mono text-sm text-slate-500">Nenhuma sincronização registrada ainda.</p>
  }

  return (
    <div className="space-y-2">
      {logs.map(log => (
        <div
          key={log.id}
          className="flex items-center justify-between gap-3 border-2 border-brutalist-black bg-white p-3 flex-wrap"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`text-[10px] font-black uppercase px-2 py-1 border-2 border-brutalist-black ${
                log.status === 'success' ? 'bg-success-green text-white' : 'bg-error-red text-white'
              }`}
            >
              {log.status === 'success' ? 'SUCESSO' : 'ERRO'}
            </span>
            <span className="text-xs font-black uppercase">{TYPE_LABELS[log.type] ?? log.type}</span>
            {log.status === 'success' && (
              <span className="text-xs font-mono text-slate-500">{log.count.toLocaleString()} registros</span>
            )}
            {log.message && (
              <span className="text-xs font-mono text-error-red truncate max-w-xs">{log.message}</span>
            )}
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {new Date(log.createdAt).toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  )
}
