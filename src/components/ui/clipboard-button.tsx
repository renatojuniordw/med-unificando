'use client'

import { useToast } from '@/components/ui/toast'

export function ClipboardButton({ text }: { text: string }) {
  const { toast } = useToast()

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      toast('Copiado!', 'success')
    } catch {
      toast('Erro ao copiar', 'error')
    }
  }

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 border border-border rounded-sm px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors"
      aria-label={`Copiar ${text}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
      </svg>
      Copiar
    </button>
  )
}
