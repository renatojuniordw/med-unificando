'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getMedicineForEdit, updateMedicine, type UpdateMedicineData } from '@/lib/actions/medicines-admin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

const FIELDS: { key: keyof UpdateMedicineData; label: string; type?: 'number' }[] = [
  { key: 'tradeName', label: 'NOME COMERCIAL' },
  { key: 'reference', label: 'REFERÊNCIA' },
  { key: 'activeIngredient', label: 'PRINCÍPIO ATIVO' },
  { key: 'similarHolder', label: 'DETENTOR DO REGISTRO' },
  { key: 'category', label: 'CATEGORIA' },
  { key: 'referenceMedicine', label: 'MEDICAMENTO REFERÊNCIA' },
  { key: 'pharmaceuticalForm', label: 'FORMA FARMACÊUTICA' },
  { key: 'concentration', label: 'CONCENTRAÇÃO' },
  { key: 'atcCode', label: 'CÓDIGO ATC' },
  { key: 'prescriptionType', label: 'TARJA' },
  { key: 'status', label: 'SITUAÇÃO' },
  { key: 'authorization', label: 'AUTORIZAÇÃO' },
  { key: 'presentationCount', label: 'APRESENTAÇÕES', type: 'number' },
  { key: 'inclusionDate', label: 'DATA DE INCLUSÃO' },
  { key: 'synonyms', label: 'SINÔNIMOS' },
  { key: 'indications', label: 'INDICAÇÕES' },
]

export default function AdminMedicineEditPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = Number(params.id)

  const [form, setForm] = useState<UpdateMedicineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)

  useEffect(() => {
    getMedicineForEdit(id).then(medicine => {
      if (!medicine) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setForm({
        reference: medicine.reference,
        activeIngredient: medicine.activeIngredient,
        tradeName: medicine.tradeName,
        similarHolder: medicine.similarHolder,
        pharmaceuticalForm: medicine.pharmaceuticalForm,
        concentration: medicine.concentration,
        inclusionDate: medicine.inclusionDate,
        category: medicine.category ?? '',
        referenceMedicine: medicine.referenceMedicine ?? '',
        atcCode: medicine.atcCode ?? '',
        prescriptionType: medicine.prescriptionType ?? '',
        status: medicine.status ?? '',
        authorization: medicine.authorization ?? '',
        presentationCount: medicine.presentationCount ?? 0,
        synonyms: medicine.synonyms ?? '',
        indications: medicine.indications ?? '',
      })
      setLoading(false)
    })
  }, [id])

  function updateField(key: keyof UpdateMedicineData, value: string) {
    setForm(prev => prev && {
      ...prev,
      [key]: key === 'presentationCount' ? Number(value) || 0 : value,
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setResult(null)
    const response = await updateMedicine(id, form)
    setResult(response)
    setSaving(false)
  }

  if (Number.isNaN(id)) {
    return <p className="max-w-2xl mx-auto font-mono text-sm">ID inválido.</p>
  }

  if (loading) {
    return <p className="max-w-2xl mx-auto font-mono text-sm">Carregando...</p>
  }

  if (notFound || !form) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-sm mb-4">Medicamento não encontrado.</p>
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/medicamentos')}>← VOLTAR À BUSCA</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Badge variant="primary" className="mb-3">ADMIN</Badge>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-brutalist-black">
            Editar {form.tradeName}
          </h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/medicamentos')}>← VOLTAR</Button>
      </div>

      <Card className="mb-6 bg-neon-yellow">
        <p className="text-xs font-mono font-bold uppercase text-brutalist-black">
          ⚠ Edições manuais podem ser perdidas na próxima sincronização com a ANVISA.
        </p>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {FIELDS.map(field => (
              <Input
                key={field.key}
                label={field.label}
                type={field.type ?? 'text'}
                value={form[field.key]}
                onChange={(e) => updateField(field.key, e.target.value)}
              />
            ))}
          </div>
        </Card>

        {result && (
          <Card
            variant={result.success ? 'active' : 'inactive'}
            className={`mb-6 ${result.success ? 'bg-success-green' : 'bg-error-red text-white'}`}
          >
            <p className="font-black uppercase tracking-wider">
              {result.success ? '✅ SALVO COM SUCESSO' : '❌ ERRO'}
            </p>
            {result.error && <p className="text-sm font-bold mt-2">{result.error}</p>}
          </Card>
        )}

        <Button type="submit" variant="secondary" size="lg" className="w-full" disabled={saving}>
          {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
        </Button>
      </form>
    </div>
  )
}
