// Minimal service worker for PWA installability
const CACHE_NAME = 'zeronix-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy — always try network, fallback to cache
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for offline fallback
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
