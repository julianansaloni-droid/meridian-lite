// Meridian Lite — Service Worker
// Scope: /meridian-lite/
// index.html is served network-first, so every deploy goes live on the
// next load — no manual version bump needed for content changes.
// Bump CACHE_VERSION only to force-refresh the precached static assets.

const CACHE_VERSION = 'meridian-lite-v4';
const CACHE_FILES = [
  '/meridian-lite/',
  '/meridian-lite/index.html',
  '/meridian-lite/icon-180.png',
  '/meridian-lite/icon-192.png',
  '/meridian-lite/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      // Cache items individually so one missing file can't break install
      // cache:'reload' so the precache is seeded from the network, never
      // from a possibly-stale browser HTTP cache entry
      Promise.allSettled(CACHE_FILES.map(f => cache.add(new Request(f, { cache: 'reload' }))))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Navigations: network-first so new deploys appear immediately,
  // with the cached app shell as the offline fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(
      // 'no-cache' bypasses the browser HTTP cache (GitHub Pages sends
      // max-age=600) and revalidates via ETag — new deploys appear on the
      // next reload instead of up to 10 minutes later
      fetch(e.request, { cache: 'no-cache' })
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() =>
          caches.match(e.request).then(r => r || caches.match('/meridian-lite/index.html'))
        )
    );
    return;
  }

  // Everything else (fonts, icons): cache-first with runtime caching,
  // so font files picked up on first online load work offline afterwards
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached ||
      fetch(e.request).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, copy));
        }
        return res;
      })
    )
  );
});
