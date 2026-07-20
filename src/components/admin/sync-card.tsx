'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ReactNode } from 'react'

interface SyncCardProps {
  title: string
  children: ReactNode
  action?: string
  loading?: boolean
  onAction?: () => void
}

export function SyncCard({ title, children, action, loading, onAction }: SyncCardProps) {
  return (
    <Card className="mb-6">
      <div className="space-y-5">
        <p className="text-lg font-semibold tracking-tight">{title}</p>
        {children}
        {action && onAction && (
          <Button
            type="button" variant="primary" size="lg" className="w-full"
            disabled={loading}
            onClick={onAction}
          >
            {loading ? 'Executando...' : action}
          </Button>
        )}
      </div>
    </Card>
  )
}
