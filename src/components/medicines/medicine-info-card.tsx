'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ClipboardButton } from '@/components/ui/clipboard-button'
import Link from 'next/link'

interface Field {
  label: string
  value: string | null
  link?: string
}

const LONG_FIELDS = ['Sinônimos', 'Indicações']

export function MedicineInfoCard({ fields }: { fields: Field[] }) {
  return (
    <Card className="mb-8">
      <div className="grid md:grid-cols-2 gap-4">
        {fields.filter(f => f.value !== null && f.value !== '').map(f => (
          <FieldRow key={f.label} field={f} />
        ))}
      </div>
    </Card>
  )
}

function FieldRow({ field: f }: { field: Field }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = LONG_FIELDS.includes(f.label) && (f.value?.length ?? 0) > 100
  const displayValue = isLong && !expanded ? f.value!.substring(0, 100) + '…' : f.value

  return (
    <div key={f.label} className="border-b border-border pb-2">
      <span className="text-xs font-semibold text-muted">{f.label}</span>
      <div className="font-medium text-[var(--color-text)] mt-0.5 flex items-center gap-2">
        {f.link ? (
          <Link href={f.link} className="hover:underline inline-flex items-center gap-1 group">
            {f.value ?? ''}
            <span className="text-muted transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        ) : f.label === 'Situação' ? (
          <span className={`inline-flex items-center gap-1.5 ${f.value === 'Ativo' ? 'text-success' : 'text-error'}`}>
            <span className={`w-2 h-2 rounded-full inline-block ${f.value === 'Ativo' ? 'bg-success' : 'bg-error'}`} />
            {f.value}
          </span>
        ) : (
          <span>
            {displayValue}
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded(prev => !prev)}
                className="ml-1 text-xs text-[var(--color-brand)] hover:underline font-normal"
              >
                {expanded ? 'ver menos' : 'ver mais'}
              </button>
            )}
          </span>
        )}
        {f.label === 'Referência' && <ClipboardButton text={f.value ?? ''} />}
      </div>
    </div>
  )
}
