/// Tijori Service Worker — Offline-first caching strategy
/// No external dependencies (replaces next-pwa + workbox)

const CACHE_VERSION = 'tijori-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;

// Assets to pre-cache on install (app shell)
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
];

// ----- Install: pre-cache app shell -----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting();
});

// ----- Activate: clean up old caches -----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('tijori-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== FONT_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Claim all open clients immediately
  self.clients.claim();
});

// ----- Fetch: routing strategies -----
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) protocols
  if (!url.protocol.startsWith('http')) return;

  // Strategy 1: Cache-first for Google Fonts
  if (url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, FONT_CACHE, 365 * 24 * 60 * 60));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com') {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }

  // Strategy 2: Cache-first for static assets (JS, CSS, images, fonts in _next/static)
  if (
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:js|css|woff2?|ttf|otf|eot|ico|png|jpg|jpeg|gif|svg|webp)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Strategy 3: Network-first for navigations and dynamic content
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Strategy 4: Stale-while-revalidate for everything else
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ----- Push notifications -----
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '1',
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});


// ============================================================
// Caching strategy helpers
// ============================================================

/** Cache-first: serve from cache, fallback to network & cache the response */
async function cacheFirst(request, cacheName, maxAgeSeconds) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // If both cache and network fail, return a basic offline response
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/** Network-first: try network, fallback to cache */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return a minimal offline HTML page
    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tijori — Offline</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0a0a0d;color:#f1f1f3;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem}
  h1{font-size:1.5rem;margin-bottom:.5rem}
  p{color:#8888a0;font-size:.9rem}
</style>
</head>
<body>
  <div>
    <h1>📦 You're offline</h1>
    <p>Tijori will reconnect when your internet is back.</p>
  </div>
</body>
</html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}

/** Stale-while-revalidate: serve from cache immediately, update cache in background */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}
