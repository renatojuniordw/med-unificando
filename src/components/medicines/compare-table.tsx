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
    <div className="overflow-x-auto border border-border rounded-md bg-[var(--color-bg)] shadow-card">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[var(--color-bg-secondary)] border-b border-border">
            <th className="text-left p-3 text-xs font-semibold text-muted w-48">
              Campo
            </th>
            {medicines.map((med) => (
              <th
                key={med.id}
                className="text-left p-3 text-xs font-semibold text-muted border-l border-border"
              >
                {med.tradeName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {detailFields.map((field, rowIndex) => {
            const values = medicines.map(
              (m) => String(m[field.key as keyof MedicineResult] ?? '')
            )
            const isDifferent = values.some((v) => v !== values[0])
            return (
              <tr
                key={field.key}
                className={`border-b border-border ${
                  rowIndex % 2 === 0 ? 'bg-[var(--color-bg)]' : 'bg-[var(--color-bg-secondary)]/50'
                }`}
              >
                <td className="p-3 text-sm font-medium text-muted bg-[var(--color-bg-secondary)] border-r border-border">
                  {field.label}
                </td>
                {medicines.map((med) => (
                  <td
                    key={`${med.id}-${field.key}`}
                    className={`p-3 text-sm text-[var(--color-text)] border-l border-border ${
                      isDifferent ? 'bg-brand-yellow/10' : ''
                    }`}
                  >
                    {String(med[field.key as keyof MedicineResult] ?? '')}
                    {isDifferent && (
                      <span className="ml-2 text-[10px] font-semibold text-brand-black bg-brand-yellow px-1 rounded-sm">
                        DIFERENTE
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
