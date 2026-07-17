'use client'

import { useState } from 'react'

export function ClipboardButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 border-2 border-brutalist-black px-2 py-1 text-[9px] font-black uppercase tracking-widest hover:bg-neon-yellow transition-colors"
    >
      {copied ? '✓ COPIADO' : '📋 COPIAR'}
    </button>
  )
}
