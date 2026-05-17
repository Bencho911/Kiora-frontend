// Service Worker Kiora — v3.1 (Network-First for HTML, Cache-First for assets)
const CACHE_NAME = 'kiora-pwa-cache-v3';
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/favicon.svg',
  '/img/logo-kiora-vectorizado.png',
  '/img/logo-kiora-vectorizado-blanco.png',
  '/img/logo-kiora-vectorizado.svg',
];

// Respuesta de fallback offline genérica (siempre es un Response válido)
const offlineFallback = () =>
  new Response('Offline — Kiora Admin no disponible sin conexión', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });

// Install: pre-cache critical static assets only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('PWA: No se pudo cachear', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('PWA: Eliminando caché antiguo:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Strategy varies by request type
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ── Ignorar: No-GET, API calls, extensiones externas ──
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;
  if (!url.protocol.startsWith('http')) return;
  // Solo interceptar mismo origen
  if (url.origin !== self.location.origin) return;

  // ── Estrategia: Network-First para HTML (páginas) ──
  if (event.request.mode === 'navigate' ||
      (event.request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Intentar caché, luego /panel, luego fallback offline
          return caches.match(event.request)
            .then(cached => {
              if (cached) return cached;
              return caches.match('/panel').then(panel => panel || offlineFallback());
            });
        })
    );
    return;
  }

  // ── Estrategia: Cache-First para assets estáticos ──
  const isStaticAsset = /\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|eot|css|js)(\?.*)?$/.test(url.pathname);
  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => offlineFallback());
      })
    );
    return;
  }

  // ── Estrategia: Network-First para todo lo demás ──
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => cached || offlineFallback());
      })
  );
});

// ── Push Notifications ──
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || 'Nueva notificación de Kiora',
    icon: '/img/logo-kiora-vectorizado.png',
    badge: '/img/logo-kiora-vectorizado.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/panel' },
    actions: [
      { action: 'open', title: 'Ver Panel' },
      { action: 'dismiss', title: 'Ignorar' },
    ],
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Kiora Admin', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/panel';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/panel') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
