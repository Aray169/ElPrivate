const CACHE_NAME = 'coaching-v2';
const assetsToCache = [
  './',
  './index.html',
  './riwayat.html',
  './klien.html',
  './pengaturan.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// Install Service Worker & Simpan Cache
self.addEventListener('install', e => {
  self.skipWaiting(); // Langsung aktifkan SW baru
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assetsToCache);
    })
  );
});

// Hapus Cache Lama jika versi CACHE_NAME berubah
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Ambil data dari Cache / Network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).catch(() => {
        // Fallback jika benar-benar offline & file tidak ditemukan di cache
        return caches.match('./index.html');
      });
    })
  );
});
