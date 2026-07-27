const CACHE_NAME = 'coaching-v3'; // Naikkan versi ke v3
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

// Install Service Worker & Simpan Cache Awali
self.addEventListener('install', e => {
  self.skipWaiting(); // Paksa SW baru langsung aktif
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
            console.log('Menghapus cache lama:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Ambil alih semua tab yang terbuka
});

// AMBIL DATA: Strategi Network-First (Prioritas Internet, Offline ke Cache)
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        // Jika berhasil ambil dari internet, perbarui simpanan di cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Jika OFFLINE (internet gagal), ambil dari Cache
        return caches.match(e.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback jika file halaman tidak ditemukan saat offline
          return caches.match('./index.html');
        });
      })
  );
});
