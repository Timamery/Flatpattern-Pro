// FlatPattern Pro — service worker
// Caches the app shell so it keeps working offline once installed. This is a
// single-page, self-contained tool (no build step, no external assets besides
// icons), so a simple cache-first strategy with a version-tagged cache name is
// enough — bump CACHE_NAME whenever the app's own files change, so returning
// users pick up the new version instead of a stale cached copy.
const CACHE_NAME = 'flatpattern-pro-v4.14.1';
const CORE_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached); // offline and not cached: fail gracefully
      // cache-first for speed and offline reliability; refresh cache in the background
      return cached || networkFetch;
    })
  );
});
