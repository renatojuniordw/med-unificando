'use client'

import { useEffect } from 'react'

// Registra o service worker (PWA) apenas no browser e em contexto seguro
// (localhost ou https). Dispone nada visível.
export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // amb antes da instalação? Sem falha visível para o usuário.
      if (process.env.NODE_ENV === 'development') {
        console.warn('[pwa] Não foi possível registrar o service worker')
      }
    })
  }, [])

  return null
}