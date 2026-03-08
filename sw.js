// UzTakip Service Worker v1.0
const CACHE_NAME = 'uztakip-v1';
const OFFLINE_URL = './index.html';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Kurulum: temel dosyaları önbelleğe al
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Aktivasyon: eski önbellekleri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: önce ağ, başarısız olursa önbellek (network-first)
self.addEventListener('fetch', event => {
  // Sadece GET isteklerini yakala
  if (event.request.method !== 'GET') return;

  // chrome-extension veya harici URL'leri atla
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Başarılı yanıtı önbelleğe de kaydet
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Ağ yoksa önbellekten sun
        return caches.match(event.request)
          .then(cached => cached || caches.match(OFFLINE_URL));
      })
  );
});
