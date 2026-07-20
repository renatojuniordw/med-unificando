'use client'

import { Button } from '@/components/ui/button'

interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

export function ConfirmModal({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  loading,
}: ConfirmModalProps) {
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
