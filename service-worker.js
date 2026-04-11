const CACHE_NAME = 'wordcard-v4';
const APP_SHELL = [
  '/word_app/',
  '/word_app/index.html',
  '/word_app/manifest.json',
  '/word_app/icon-192.png',
  '/word_app/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of APP_SHELL) {
        try { await cache.add(url); } catch (e) { /* ignore individual failures */ }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => {
          try { cache.put(req, copy); } catch (e) { /* ignore */ }
        });
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') {
          return caches.match('/word_app/index.html');
        }
        return new Response('', {status: 504, statusText: 'Offline'});
      });
    })
  );
});
