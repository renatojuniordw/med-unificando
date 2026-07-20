import type { MedicineResult } from '@/types'

const detailFields = [
  { key: 'reference', label: 'Referência' },
  { key: 'activeIngredient', label: 'Princípio Ativo' },
  { key: 'tradeName', label: 'Nome Comercial' },
  { key: 'similarHolder', label: 'Detentor do Registro' },
  { key: 'category', label: 'Categoria' },
  { key: 'referenceMedicine', label: 'Medicamento Referência' },
  { key: 'pharmaceuticalForm', label: 'Forma Farmacêutica' },
  { key: 'concentration', label: 'Concentração' },
  { key: 'atcCode', label: 'Código ATC' },
  { key: 'prescriptionType', label: 'Tarja' },
  { key: 'status', label: 'Situação' },
  { key: 'authorization', label: 'Autorização' },
  { key: 'presentationCount', label: 'Apresentações' },
  { key: 'synonyms', label: 'Sinônimos' },
  { key: 'indications', label: 'Indicações' },
  { key: 'inclusionDate', label: 'Data de Inclusão' },
]

function getValues(field: string, medicines: MedicineResult[]) {
  return medicines.map(m => String(m[field as keyof MedicineResult] ?? ''))
}

function isFieldDifferent(field: string, medicines: MedicineResult[]) {
  const values = getValues(field, medicines)
  return values.some(v => v !== values[0])
}

interface CompareTableProps {
  medicines: MedicineResult[]
}

export function CompareTable({ medicines }: CompareTableProps) {
  if (medicines.length === 0) {
    return (
      <div className="text-center py-12 bg-[var(--color-bg)] border border-border rounded-md shadow-card">
        <p className="font-semibold text-lg text-[var(--color-text)]">
          Nenhum medicamento selecionado
        </p>
        <p className="text-sm text-muted mt-2">
          Use a busca acima para adicionar medicamentos à comparação
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile: Cards */}
      <div className="space-y-4 md:hidden">
        {medicines.map(med => (
          <div key={med.id} className="border border-border rounded-md bg-[var(--color-bg)] shadow-card p-4">
            <p className="font-semibold text-sm text-[var(--color-text)] mb-3 border-b border-border pb-2">
              {med.tradeName}
            </p>
            <div className="space-y-2">
              {detailFields.map(field => {
                const value = String(med[field.key as keyof MedicineResult] ?? '')
                const different = isFieldDifferent(field.key, medicines)
                return (
                  <div key={field.key} className="flex justify-between items-start gap-2 text-xs">
                    <span className="text-muted shrink-0 w-1/3">{field.label}</span>
                    <span className={`text-right ${different ? 'text-brand-black font-medium bg-brand-yellow/10 px-1 rounded-sm' : 'text-[var(--color-text)]'}`}>
                      {value}
                      {different && <span className="ml-1 text-[9px] font-semibold text-brand-black">≠</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block overflow-x-auto border border-border rounded-md bg-[var(--color-bg)] shadow-card">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[var(--color-bg-secondary)] border-b border-border">
              <th className="text-left p-3 text-xs font-semibold text-muted w-48">Campo</th>
              {medicines.map(med => (
                <th key={med.id} className="text-left p-3 text-xs font-semibold text-muted border-l border-border">
                  {med.tradeName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {detailFields.map((field, rowIndex) => {
              const different = isFieldDifferent(field.key, medicines)
              return (
                <tr key={field.key} className={`border-b border-border ${rowIndex % 2 === 0 ? 'bg-[var(--color-bg)]' : 'bg-[var(--color-bg-secondary)]/50'}`}>
                  <td className="p-3 text-sm font-medium text-muted bg-[var(--color-bg-secondary)] border-r border-border">
                    {field.label}
                  </td>
                  {medicines.map(med => (
                    <td key={`${med.id}-${field.key}`} className={`p-3 text-sm text-[var(--color-text)] border-l border-border ${different ? 'bg-brand-yellow/10' : ''}`}>
                      {String(med[field.key as keyof MedicineResult] ?? '')}
                      {different && (
                        <span className="ml-2 text-[10px] font-semibold text-brand-black bg-brand-yellow px-1 rounded-sm">DIFERENTE</span>
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
