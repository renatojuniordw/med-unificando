'use client'

import { useEffect, useState } from 'react'
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

export default function AdminImportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<'medicines' | 'prices' | 'embeddings' | null>(null)
  const [importInfo, setImportInfo] = useState<ImportInfo | null>(null)
  const [priceInfo, setPriceInfo] = useState<{ total: number; withPrice: number } | null>(null)
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [infoLoaded, setInfoLoaded] = useState(false)
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

  async function handleSyncMedicines() {
    setLoading('medicines')
    setResult(null)
    const response = await syncWithAnvisa()
    setResult({ type: 'medicines', ...response })
    setLoading(null)
    const info = await getImportInfo()
    setImportInfo(info)
    await refreshLogs()
  }

  async function handleSyncPrices() {
    setLoading('prices')
    setResult(null)
    const response = await syncPrices()
    setResult({ type: 'prices', ...response })
    setLoading(null)
    const pStats = await getPriceStats()
    setPriceInfo(pStats)
    await refreshLogs()
  }

  async function handleGenerateEmbeddings() {
    setLoading('embeddings')
    setResult(null)
    const response = await regenerateEmbeddings()
    setResult({ type: 'embeddings', ...response })
    setLoading(null)
    await refreshLogs()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Badge variant="primary" className="mb-3">ADMIN</Badge>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-brutalist-black">
            Administração
          </h1>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>VOLTAR AO SITE</Button>
          <Button variant="danger" size="sm" onClick={() => signOut({ callbackUrl: '/admin/login' })}>SAIR</Button>
        </div>
      </div>

      {/* Medicamentos Section */}
      <Card className="mb-6">
        <div className="space-y-5">
          <p className="text-lg font-black uppercase tracking-tight">1. Medicamentos</p>

          <div className="border-4 border-brutalist-black p-6 bg-white space-y-3">
            {!infoLoaded ? (
              <p className="font-mono text-sm">Carregando...</p>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase">Total</span>
                  <span className="text-2xl font-black">{importInfo?.total ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase">Última sincronização</span>
                  <span className="text-sm font-bold">
                    {importInfo?.lastImport ? new Date(importInfo.lastImport).toLocaleString('pt-BR') : 'Nunca'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase">Arquivo ANVISA</span>
                  <span className="text-sm font-bold">
                    {importInfo?.anvisaFileDate ? new Date(importInfo.anvisaFileDate).toLocaleString('pt-BR') : '---'}
                  </span>
                </div>
              </>
            )}
          </div>

          <Button
            type="button" variant="secondary" size="lg" className="w-full"
            disabled={loading === 'medicines'} onClick={handleSyncMedicines}
          >
            {loading === 'medicines' ? 'SINCRONIZANDO...' : 'SINCRONIZAR MEDICAMENTOS'}
          </Button>
        </div>
      </Card>

      {/* Preços Section */}
      <Card className="mb-6">
        <div className="space-y-5">
          <p className="text-lg font-black uppercase tracking-tight">2. Preços CMED</p>

          <div className="border-4 border-brutalist-black p-6 bg-white space-y-3">
            {!infoLoaded ? (
              <p className="font-mono text-sm">Carregando...</p>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase">Total de preços</span>
                  <span className="text-2xl font-black">{priceInfo?.total ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase">Com preço PF0</span>
                  <span className="text-sm font-bold">{priceInfo?.withPrice ?? 0}</span>
                </div>
              </>
            )}
          </div>

          <Button
            type="button" variant="secondary" size="lg" className="w-full"
            disabled={loading === 'prices'} onClick={handleSyncPrices}
          >
            {loading === 'prices' ? 'IMPORTANDO...' : 'IMPORTAR PREÇOS CMED'}
          </Button>
        </div>
      </Card>

      {/* Editar Medicamento Section */}
      <Card className="mb-6">
        <div className="space-y-5">
          <p className="text-lg font-black uppercase tracking-tight">3. Editar Medicamento</p>
          <p className="text-xs font-mono text-slate-500">
            Busque um medicamento e corrija dados manualmente. Edições podem ser perdidas na próxima sincronização com a ANVISA.
          </p>
          <Link href="/admin/medicamentos">
            <Button type="button" variant="secondary" size="lg" className="w-full">
              BUSCAR MEDICAMENTO PARA EDITAR
            </Button>
          </Link>
        </div>
      </Card>

      {/* Busca Semântica Section */}
      <Card className="mb-6">
        <div className="space-y-5">
          <p className="text-lg font-black uppercase tracking-tight">4. Busca Semântica</p>
          <p className="text-xs font-mono text-slate-500">
            Regenera os embeddings usados pela busca por IA a partir dos medicamentos atuais no banco. Pode levar alguns minutos.
          </p>
          <Button
            type="button" variant="secondary" size="lg" className="w-full"
            disabled={loading === 'embeddings'} onClick={handleGenerateEmbeddings}
          >
            {loading === 'embeddings' ? 'GERANDO EMBEDDINGS...' : 'GERAR EMBEDDINGS'}
          </Button>
        </div>
      </Card>

      {result && (
        <Card
          variant={result.success ? 'active' : 'inactive'}
          className={`mb-6 ${result.success ? 'bg-success-green' : 'bg-error-red text-white'}`}
        >
          <p className="font-black uppercase tracking-wider">
            {result.type === 'medicines' ? '💊 ' : result.type === 'prices' ? '💰 ' : '🧠 '}
            {result.success ? '✅ SUCESSO' : '❌ ERRO'}
          </p>
          <p className="text-sm font-bold mt-2">{result.success ? result.message : result.error}</p>
        </Card>
      )}

      <Card className="mb-6">
        <p className="text-lg font-black uppercase tracking-tight mb-4">Histórico de Sincronizações</p>
        <SyncLogList logs={syncLogs} />
      </Card>

      <div className="bg-white border-4 border-brutalist-black p-4 text-[10px] font-mono text-slate-500 space-y-1">
        <p><strong className="text-brutalist-black">Fontes:</strong></p>
        <p>Medicamentos: dados.anvisa.gov.br/dados/CONSULTAS/PRODUTOS/TA_CONSULTA_MEDICAMENTOS.CSV</p>
        <p>Preços: dados.anvisa.gov.br/dados/TA_PRECOS_MEDICAMENTOS.csv</p>
      </div>
    </div>
  )
}
