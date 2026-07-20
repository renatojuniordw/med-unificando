'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getMedicineForEdit, updateMedicine, type UpdateMedicineData } from '@/lib/actions/medicines-admin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

const FIELDS: { key: keyof UpdateMedicineData; label: string; type?: 'number' }[] = [
  { key: 'tradeName', label: 'Nome Comercial' },
  { key: 'reference', label: 'Referência' },
  { key: 'activeIngredient', label: 'Princípio Ativo' },
  { key: 'similarHolder', label: 'Detentor do Registro' },
  { key: 'category', label: 'Categoria' },
  { key: 'referenceMedicine', label: 'Medicamento Referência' },
  { key: 'pharmaceuticalForm', label: 'Forma Farmacêutica' },
  { key: 'concentration', label: 'Concentração' },
  { key: 'atcCode', label: 'Código ATC' },
  { key: 'prescriptionType', label: 'Tarja' },
  { key: 'status', label: 'Situação' },
  { key: 'authorization', label: 'Autorização' },
  { key: 'presentationCount', label: 'Apresentações', type: 'number' },
  { key: 'inclusionDate', label: 'Data de Inclusão' },
  { key: 'synonyms', label: 'Sinônimos' },
  { key: 'indications', label: 'Indicações' },
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
    return <p className="max-w-2xl mx-auto text-sm text-muted">ID inválido.</p>
  }

  if (loading) {
    return <p className="max-w-2xl mx-auto text-sm text-muted">Carregando...</p>
  }

  if (notFound || !form) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-muted mb-4">Medicamento não encontrado.</p>
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/medicamentos')}>← Voltar</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Badge variant="primary" className="mb-3">Admin</Badge>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-[var(--color-text)]">
            Editar {form.tradeName}
          </h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/medicamentos')}>← Voltar</Button>
      </div>

      <Card variant="highlight" className="mb-6">
        <p className="text-xs text-muted">
          Edições manuais podem ser perdidas na próxima sincronização com a ANVISA.
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
                value={String(form[field.key] ?? '')}
                onChange={(e) => updateField(field.key, e.target.value)}
              />
            ))}
          </div>
        </Card>

        {result && (
          <Card
            variant={result.success ? 'active' : 'inactive'}
            className={`mb-6 ${result.success ? 'border-l-4 border-l-success' : 'border-l-4 border-l-error'}`}
          >
            <p className="font-medium text-[var(--color-text)]">
              {result.success ? 'Salvo com sucesso' : 'Erro'}
            </p>
            {result.error && <p className="text-sm text-muted mt-1">{result.error}</p>}
          </Card>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </div>
  )
}
