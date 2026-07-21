import { Card } from '@/components/ui/card'
import { ClipboardButton } from '@/components/ui/clipboard-button'
import Link from 'next/link'

interface Field {
  label: string
  value: string | null
  link?: string
}

export function MedicineInfoCard({ fields }: { fields: Field[] }) {
  return (
    <Card className="mb-8">
      <div className="grid md:grid-cols-2 gap-4">
        {fields.filter(f => f.value !== null && f.value !== '').map(f => (
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
              ) : f.value}
              {f.label === 'Referência' && <ClipboardButton text={f.value ?? ''} />}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
