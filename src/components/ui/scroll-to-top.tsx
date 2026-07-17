'use client'

import { useState, useEffect } from 'react'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-brutalist-black text-neon-yellow border-4 border-neon-yellow font-black text-xl shadow-hard-lg hover:-translate-y-1 transition-all"
      aria-label="Voltar ao topo"
    >
      ↑
    </button>
  )
}
