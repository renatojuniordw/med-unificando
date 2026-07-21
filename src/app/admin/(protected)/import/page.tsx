'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { syncWithAnvisa, getImportInfo, getSyncLogs } from '@/lib/actions/admin'
import { syncPrices, getPriceStats } from '@/lib/actions/prices'
import { regenerateEmbeddings } from '@/lib/actions/embeddings'
import { SyncLogList } from '@/components/admin/sync-log-list'
import { SyncCard } from '@/components/admin/sync-card'
import { ConfirmModal } from '@/components/admin/confirm-modal'
import { ImportStats } from '@/components/admin/import-stats'
import { PriceStats } from '@/components/admin/price-stats'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { ImportInfo } from '@/types'
import type { SyncLog } from '@/generated/prisma/client'

export default function AdminImportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<'medicines' | 'prices' | 'embeddings' | null>(null)
  const [importInfo, setImportInfo] = useState<ImportInfo | null>(null)
  const [priceInfo, setPriceInfo] = useState<{ total: number; withPrice: number } | null>(null)
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [infoLoaded, setInfoLoaded] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'medicines' | 'prices' | 'embeddings'
    title: string
    description: string
  } | null>(null)
  const [result, setResult] = useState<{
    type: 'medicines' | 'prices' | 'embeddings'
    success: boolean
    message?: string
    error?: string
    count?: number
    skipped?: boolean
  } | null>(null)

  useEffect(() => {
    Promise.all([getImportInfo(), getPriceStats(), getSyncLogs()]).then(([info, pStats, logs]) => {
      setImportInfo(info)
      setPriceInfo(pStats)
      setSyncLogs(logs)
      setInfoLoaded(true)
    })
  }, [])

  async function refreshLogs() {
    const logs = await getSyncLogs()
    setSyncLogs(logs)
  }

  const executeAction = useCallback(async (type: 'medicines' | 'prices' | 'embeddings') => {
    setLoading(type)
    setResult(null)
    setConfirmAction(null)

    let response
    if (type === 'medicines') response = await syncWithAnvisa()
    else if (type === 'prices') response = await syncPrices()
    else response = await regenerateEmbeddings()

    setResult({ type, ...response })
    setLoading(null)

    if (type === 'medicines') {
      const info = await getImportInfo()
      setImportInfo(info)
    } else if (type === 'prices') {
      const pStats = await getPriceStats()
      setPriceInfo(pStats)
    }
    await refreshLogs()
  }, [])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Badge variant="primary" className="mb-3">Admin</Badge>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-[var(--color-text)]">
            Administração
          </h1>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>Voltar ao site</Button>
          <Button variant="danger" size="sm" onClick={() => signOut({ callbackUrl: '/admin/login' })}>Sair</Button>
        </div>
      </div>

      <SyncCard
        title="1. Medicamentos"
        action={loading === 'medicines' ? 'Sincronizando...' : 'Sincronizar Medicamentos'}
        loading={loading === 'medicines'}
        onAction={() => setConfirmAction({
          type: 'medicines',
          title: 'Sincronizar Medicamentos',
          description: 'Esta ação baixará os dados mais recentes da ANVISA e atualizará o banco. Pode levar alguns minutos.'
        })}
      >
        {!infoLoaded ? (
          <p className="text-sm text-muted">Carregando...</p>
        ) : (
          <ImportStats info={importInfo} />
        )}
      </SyncCard>

      <SyncCard
        title="2. Preços CMED"
        action={loading === 'prices' ? 'Importando...' : 'Importar Preços CMED'}
        loading={loading === 'prices'}
        onAction={() => setConfirmAction({
          type: 'prices',
          title: 'Importar Preços CMED',
          description: 'Esta ação baixará a tabela de preços CMED mais recente da ANVISA.'
        })}
      >
        {!infoLoaded ? (
          <p className="text-sm text-muted">Carregando...</p>
        ) : (
          <PriceStats info={priceInfo} />
        )}
      </SyncCard>

      <Card className="mb-6">
        <div className="space-y-5">
          <p className="text-lg font-semibold tracking-tight">3. Editar Medicamento</p>
          <p className="text-xs text-muted">
            Busque um medicamento e corrija dados manualmente. Edições podem ser perdidas na próxima sincronização com a ANVISA.
          </p>
          <Link href="/admin/medicamentos">
            <Button type="button" variant="secondary" size="lg" className="w-full">
              Buscar medicamento para editar
            </Button>
          </Link>
        </div>
      </Card>

      <SyncCard
        title="4. Busca Semântica"
        action={loading === 'embeddings' ? 'Gerando embeddings...' : 'Gerar Embeddings'}
        loading={loading === 'embeddings'}
        onAction={() => setConfirmAction({
          type: 'embeddings',
          title: 'Gerar Embeddings',
          description: 'Esta ação regenerará todos os embeddings de busca semântica. Pode levar vários minutos.'
        })}
      >
        <p className="text-xs text-muted">
          Regenera os embeddings usados pela busca por IA a partir dos medicamentos atuais no banco. Pode levar alguns minutos.
        </p>
      </SyncCard>

      {result && (
        <Card
          variant={result.success ? 'active' : 'inactive'}
          className={`mb-6 ${result.success ? 'border-l-4 border-l-success' : 'border-l-4 border-l-error'}`}
        >
          <p className="font-semibold text-[var(--color-text)]">
            {result.success ? 'Sucesso' : 'Erro'}
          </p>
          <p className="text-sm text-muted mt-1">{result.success ? result.message : result.error}</p>
        </Card>
      )}

      <Card className="mb-6">
        <p className="text-lg font-semibold tracking-tight mb-4">Histórico de Sincronizações</p>
        <SyncLogList logs={syncLogs} />
      </Card>

      <div className="bg-[var(--color-bg)] border border-border rounded-sm p-4 text-xs text-muted space-y-1">
        <p><strong className="text-[var(--color-text)]">Fontes:</strong></p>
        <p>Medicamentos: {importInfo?.medicinesUrl}</p>
        <p>Preços: {importInfo?.pricesUrl}</p>
      </div>

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title ?? ''}
        description={confirmAction?.description ?? ''}
        loading={loading !== null}
        onConfirm={() => confirmAction && executeAction(confirmAction.type)}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
