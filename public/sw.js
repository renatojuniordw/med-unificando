/* Service Worker — Med Unificando (PWA).
 * Estratégias:
 *  - App shell: navegações same-origin → network-first com fallback ao cache (offline básico).
 *  - Assets estáticos (_next/static) → cache-first (imutáveis por hash).
 *  - NÃO cachear: /admin/* (sessão), APIs (POST), nem estados autenticados.
 * Bump `VERSION` para invalidar caches antigos.
 */
const VERSION = 'v1.0.0'
const SHELL_CACHE = `unificando-shell-${VERSION}`
const STATIC_CACHE = `unificando-static-${VERSION}`

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll([
      '/',
      '/manifest.json',
      '/icon-192.png',
      '/icon-512.png',
    ]))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => !k.startsWith('unificando-shell-') && !k.startsWith('unificando-static-'))
        .map(k => caches.delete(k))
    ))
  )
  self.clients.claim()
})

function isAdminOrApi(url) {
  return url.pathname.startsWith('/admin') || url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/dashboard')
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (isAdminOrApi(url)) return // sessão/dados dinâmicos: sempre rede

  // Assets estáticos do Next: cache-first (imutáveis, hash no filename)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(cached =>
        cached || fetch(request).then(res => {
          const copy = res.clone()
          caches.open(STATIC_CACHE).then(c => c.put(request, copy))
          return res
        })
      )
    )
    return
  }

  // Navegações: network-first com fallback ao shell
  event.respondWith(
    fetch(request)
      .then(res => {
        const copy = res.clone()
        caches.open(SHELL_CACHE).then(c => c.put(request, copy))
        return res
      })
      .catch(() => caches.match(request).then(m => m || caches.match('/')))
  )
})