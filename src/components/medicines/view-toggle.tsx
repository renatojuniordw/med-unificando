'use client'

import { Button } from '@/components/ui/button'

interface ViewToggleProps {
  view: 'cards' | 'table'
  onChange: (view: 'cards' | 'table') => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant={view === 'cards' ? 'primary' : 'ghost'}
        size="sm"
        data-testid="view-toggle-cards"
        aria-pressed={view === 'cards'}
        onClick={() => onChange('cards')}
      >
        Cards
      </Button>
      <Button
        type="button"
        variant={view === 'table' ? 'primary' : 'ghost'}
        size="sm"
        data-testid="view-toggle-table"
        aria-pressed={view === 'table'}
        onClick={() => onChange('table')}
      >
        Tabela
      </Button>
    </div>
  )
}
