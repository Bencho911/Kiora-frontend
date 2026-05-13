// Service Worker Básico de Kiora
const CACHE_NAME = 'kiora-pwa-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/login',
  '/panel',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/img/logo-kiora-vectorizado.png',
  '/img/logo-kiora-vectorizado.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usar catch individual para no fallar todo si falta algo
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url).catch(err => console.warn('PWA: No se pudo cachear', url, err)))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Solo interceptar GET requests
  if (event.request.method !== 'GET') return;
  
  // Ignorar llamadas a la API o recursos externos innecesarios
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return;
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
       return fetch(event.request).then((networkResponse) => {
          // Solo cacheamos si la respuesta es válida y pertenece al mismo origen
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                 cache.put(event.request, responseToCache);
              });
          }
          return networkResponse;
       }).catch(() => {
          // Fallback a caché si existe
          if (cachedResponse) {
              return cachedResponse;
          }
          // Si es un documento HTML y no tiene caché, dirigimos al panel
          if (event.request.mode === 'navigate') {
              return caches.match('/panel').then(panelCache => {
                  return panelCache || caches.match('/');
              });
          }
       });
    })
  );
});
