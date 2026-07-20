'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { syncWithAnvisa, getImportInfo, getSyncLogs } from '@/lib/actions/admin'
import { syncPrices, getPriceStats } from '@/lib/actions/prices'
import { regenerateEmbeddings } from '@/lib/actions/embeddings'
import { SyncLogList } from '@/components/admin/sync-log-list'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { ImportInfo } from '@/types'
import type { SyncLog } from '@/generated/prisma/client'

function ConfirmModal({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-[var(--color-bg)] border border-border rounded-md shadow-modal p-6 max-w-sm w-full">
        <p className="font-semibold text-lg text-[var(--color-text)] mb-2">{title}</p>
        <p className="text-sm text-muted mb-6">{description}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm} disabled={loading}>
            {loading ? 'Executando...' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

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

      <Card className="mb-6">
        <div className="space-y-5">
          <p className="text-lg font-semibold tracking-tight">1. Medicamentos</p>

          <div className="border border-border rounded-sm p-4 bg-[var(--color-bg)] space-y-3">
            {!infoLoaded ? (
              <p className="text-sm text-muted">Carregando...</p>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted">Total</span>
                  <span className="text-2xl font-black text-[var(--color-text)]">{importInfo?.total ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted">Última sincronização</span>
                  <span className="text-sm font-medium text-[var(--color-text)]">
                    {importInfo?.lastImport ? new Date(importInfo.lastImport).toLocaleString('pt-BR') : 'Nunca'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted">Arquivo ANVISA</span>
                  <span className="text-sm font-medium text-[var(--color-text)]">
                    {importInfo?.anvisaFileDate ? new Date(importInfo.anvisaFileDate).toLocaleString('pt-BR') : '---'}
                  </span>
                </div>
              </>
            )}
          </div>

          <Button
            type="button" variant="primary" size="lg" className="w-full"
            disabled={loading === 'medicines'}
            onClick={() => setConfirmAction({
              type: 'medicines',
              title: 'Sincronizar Medicamentos',
              description: 'Esta ação baixará os dados mais recentes da ANVISA e atualizará o banco. Pode levar alguns minutos.'
            })}
          >
            {loading === 'medicines' ? 'Sincronizando...' : 'Sincronizar Medicamentos'}
          </Button>
        </div>
      </Card>

      <Card className="mb-6">
        <div className="space-y-5">
          <p className="text-lg font-semibold tracking-tight">2. Preços CMED</p>

          <div className="border border-border rounded-sm p-4 bg-[var(--color-bg)] space-y-3">
            {!infoLoaded ? (
              <p className="text-sm text-muted">Carregando...</p>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted">Total de preços</span>
                  <span className="text-2xl font-black text-[var(--color-text)]">{priceInfo?.total ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted">Com preço PF0</span>
                  <span className="text-sm font-medium text-[var(--color-text)]">{priceInfo?.withPrice ?? 0}</span>
                </div>
              </>
            )}
          </div>

          <Button
            type="button" variant="primary" size="lg" className="w-full"
            disabled={loading === 'prices'}
            onClick={() => setConfirmAction({
              type: 'prices',
              title: 'Importar Preços CMED',
              description: 'Esta ação baixará a tabela de preços CMED mais recente da ANVISA.'
            })}
          >
            {loading === 'prices' ? 'Importando...' : 'Importar Preços CMED'}
          </Button>
        </div>
      </Card>

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

      <Card className="mb-6">
        <div className="space-y-5">
          <p className="text-lg font-semibold tracking-tight">4. Busca Semântica</p>
          <p className="text-xs text-muted">
            Regenera os embeddings usados pela busca por IA a partir dos medicamentos atuais no banco. Pode levar alguns minutos.
          </p>
          <Button
            type="button" variant="primary" size="lg" className="w-full"
            disabled={loading === 'embeddings'}
            onClick={() => setConfirmAction({
              type: 'embeddings',
              title: 'Gerar Embeddings',
              description: 'Esta ação regenerará todos os embeddings de busca semântica. Pode levar vários minutos.'
            })}
          >
            {loading === 'embeddings' ? 'Gerando embeddings...' : 'Gerar Embeddings'}
          </Button>
        </div>
      </Card>

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
        <p>Medicamentos: dados.anvisa.gov.br/dados/CONSULTAS/PRODUTOS/TA_CONSULTA_MEDICAMENTOS.CSV</p>
        <p>Preços: dados.anvisa.gov.br/dados/TA_PRECOS_MEDICAMENTOS.csv</p>
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
