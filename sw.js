const CACHE_NAME = 'coachlog-v1';
const assets = [
  'index.html',
  'riwayat.html',
  'klien.html',
  'pengaturan.html',
  'style.css',
  'script.js'
];

// Install Service Worker
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// Fetch Assets
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      return cachedResponse || fetch(e.request);
    })
  );
});