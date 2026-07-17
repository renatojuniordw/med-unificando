'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { syncWithAnvisa, getImportInfo } from '@/lib/actions/admin'
import { syncPrices, getPriceStats } from '@/lib/actions/prices'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { ImportInfo } from '@/types'

export default function AdminImportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<'medicines' | 'prices' | null>(null)
  const [importInfo, setImportInfo] = useState<ImportInfo | null>(null)
  const [priceInfo, setPriceInfo] = useState<{ total: number; withPrice: number } | null>(null)
  const [infoLoaded, setInfoLoaded] = useState(false)
  const [result, setResult] = useState<{
    type: 'medicines' | 'prices'
    success: boolean
    message?: string
    error?: string
    count?: number
    skipped?: boolean
  } | null>(null)

  useState(() => {
    Promise.all([getImportInfo(), getPriceStats()]).then(([info, pStats]) => {
      setImportInfo(info)
      setPriceInfo(pStats)
      setInfoLoaded(true)
    })
  })

  async function handleSyncMedicines() {
    setLoading('medicines')
    setResult(null)
    const response = await syncWithAnvisa()
    setResult({ type: 'medicines', ...response })
    setLoading(null)
    const info = await getImportInfo()
    setImportInfo(info)
  }

  async function handleSyncPrices() {
    setLoading('prices')
    setResult(null)
    const response = await syncPrices()
    setResult({ type: 'prices', ...response })
    setLoading(null)
    const pStats = await getPriceStats()
    setPriceInfo(pStats)
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

      {result && (
        <Card variant={result.success ? 'active' : 'inactive'} className={result.success ? 'bg-success-green' : 'bg-error-red text-white'}>
          <p className="font-black uppercase tracking-wider">
            {result.type === 'medicines' ? '💊 ' : '💰 '}
            {result.success ? '✅ SUCESSO' : '❌ ERRO'}
          </p>
          <p className="text-sm font-bold mt-2">{result.success ? result.message : result.error}</p>
        </Card>
      )}

      <div className="bg-white border-4 border-brutalist-black p-4 text-[10px] font-mono text-slate-500 space-y-1">
        <p><strong className="text-brutalist-black">Fontes:</strong></p>
        <p>Medicamentos: dados.anvisa.gov.br/dados/CONSULTAS/PRODUTOS/TA_CONSULTA_MEDICAMENTOS.CSV</p>
        <p>Preços: dados.anvisa.gov.br/dados/TA_PRECOS_MEDICAMENTOS.csv</p>
      </div>
    </div>
  )
}
