// Meridian Lite — Service Worker
// Scope: /meridian-lite/
// Update CACHE_VERSION whenever index.html changes

const CACHE_VERSION = 'meridian-lite-v2';
const CACHE_FILES = [
  '/meridian-lite/',
  '/meridian-lite/index.html',
  '/meridian-lite/sw.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
