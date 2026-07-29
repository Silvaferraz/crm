const CACHE = 'crm-v1'
const STATIC_CACHE = 'static-v1'

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => { if (k !== CACHE && k !== STATIC_CACHE) return caches.delete(k) })))
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  const isAPI = url.href.includes('/rest/v1/rpc/')
  const isAuth = url.href.includes('/auth/v1/')
  const isStorage = url.href.includes('/storage/v1/')

  if (isAPI || isAuth) {
    e.respondWith(networkFirst(e.request))
  } else if (isStorage) {
    e.respondWith(staleWhileRevalidate(e.request))
  } else {
    e.respondWith(networkFirst(e.request))
  }
})

async function networkFirst(req) {
  try {
    const res = await fetch(req)
    const cache = await caches.open(CACHE)
    cache.put(req, res.clone())
    return res
  } catch {
    const cached = await caches.match(req)
    if (cached) return cached
    if (req.mode === 'navigate') return caches.match('/offline/')
    return new Response('Offline', { status: 503 })
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(req)
  const fetchPromise = fetch(req).then(res => { cache.put(req, res.clone()); return res }).catch(() => null)
  return cached || fetchPromise || new Response('Offline', { status: 503 })
}
